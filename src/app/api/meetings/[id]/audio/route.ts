import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("audio_file_path")
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .single();

    if (meetingError || !meeting?.audio_file_path) {
      return NextResponse.json(
        { error: "Audio file not found" },
        { status: 404 }
      );
    }

    // Generate signed URL from Supabase Storage (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("meeting-audio")
      .createSignedUrl(meeting.audio_file_path, 3600);

    if (signedError || !signedData?.signedUrl) {
      const { data: publicData } = supabase.storage
        .from("meeting-audio")
        .getPublicUrl(meeting.audio_file_path);

      return NextResponse.json({
        audioUrl: publicData?.publicUrl || null,
        filePath: meeting.audio_file_path,
      });
    }

    return NextResponse.json({
      audioUrl: signedData.signedUrl,
      filePath: meeting.audio_file_path,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to load audio";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

