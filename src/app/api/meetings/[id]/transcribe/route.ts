import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Meeting
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

    // 3. Download Audio
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("meeting-audio")
      .download(meeting.audio_file_path);

    if (downloadError || !fileData) {
      await supabase.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json({ error: "Failed to download audio file" }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = meeting.audio_file_path.split(".").pop() || "webm";
    const fileForGroq = new File([buffer], `audio.${ext}`, { type: fileData.type || "audio/webm" });

    // 4. Groq Whisper Call
    const transcription = await groq.audio.transcriptions.create({
      file: fileForGroq,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      temperature: 0.0,
    });

    const fullText = transcription.text;
    const durationSeconds = Math.round((transcription as any).duration || 0);

    // 5. Clean prior transcript & save fresh row
    await supabase.from("transcripts").delete().eq("meeting_id", meetingId);

    const { error: transcriptError } = await supabase
      .from("transcripts")
      .insert({
        meeting_id: meetingId,
        full_text: fullText,
        raw_groq_response: transcription as unknown as Record<string, unknown>,
      });

    if (transcriptError) {
      console.error("DB Error on Transcripts:", transcriptError);
      await supabase.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json(
        { error: `Database Error: ${transcriptError.message}` },
        { status: 500 }
      );
    }

    // 6. Set status to summarizing
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
  } catch (err: any) {
    console.error("Transcribe Route catch error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during transcription" },
      { status: 500 }
    );
  }
}