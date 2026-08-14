import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/profile";
import Groq from "groq-sdk";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });
    const supabase = await createClient();

    // Fetch Meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .single();

    if (meetingError || !meeting?.audio_file_path) {
      return NextResponse.json(
        { error: "Meeting or audio file missing" },
        { status: 404 }
      );
    }

    // Mark as transcribing
    await supabase.from("meetings").update({ status: "transcribing" }).eq("id", meetingId);

    // Download Audio from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("meeting-audio")
      .download(meeting.audio_file_path);

    if (downloadError || !fileData) {
      await supabase.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json(
        { error: `Failed to download audio file: ${downloadError?.message || "File not found"}` },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = meeting.audio_file_path.split(".").pop() || "webm";
    const fileForGroq = new File([buffer], `audio.${ext}`, { type: fileData.type || "audio/webm" });

    // Groq Whisper Call
    const transcription = await groq.audio.transcriptions.create({
      file: fileForGroq,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      temperature: 0.0,
    });

    const fullText = transcription.text;
    const durationSeconds = Math.round(
      (transcription as unknown as { duration?: number }).duration || 0
    );

    // Clean prior transcript & save fresh row
    await supabase.from("transcripts").delete().eq("meeting_id", meetingId);

    await supabase.from("transcripts").insert({
      meeting_id: meetingId,
      full_text: fullText,
      raw_groq_response: transcription as unknown as Record<string, unknown>,
    });

    // Set status to summarizing
    const { data: updatedMeeting } = await supabase
      .from("meetings")
      .update({
        status: "summarizing",
        duration_seconds: durationSeconds,
      })
      .eq("id", meetingId)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
      transcript: fullText,
    });
  } catch (err: unknown) {
    console.error("Transcribe Route catch error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error during transcription";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

