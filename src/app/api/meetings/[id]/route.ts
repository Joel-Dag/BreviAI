import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id;
    const supabase = await createClient();

    // 1. Fetch meeting to locate its exact audio path
    const { data: meeting, error: fetchError } = await supabase
      .from("meetings")
      .select("audio_file_path")
      .eq("id", meetingId)
      .single();

    if (fetchError || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // 2. Delete audio file from the 'meeting-audio' bucket
    if (meeting.audio_file_path) {
      // Clean up string in case it starts with a leading slash or URL domain
      let cleanPath = meeting.audio_file_path;

      if (cleanPath.includes("meeting-audio/")) {
        cleanPath = cleanPath.split("meeting-audio/")[1];
      }

      if (cleanPath.startsWith("/")) {
        cleanPath = cleanPath.substring(1);
      }

      console.log("Deleting storage path:", cleanPath); 
      // Expecting output format like: "46297341-44e5-45c1-8d3e-7cae47a44d30/1786742362361-mcz1k.webm"

      const { data: storageData, error: storageError } = await supabase.storage
        .from("meeting-audio") // Exact bucket name
        .remove([cleanPath]);

      if (storageError) {
        console.error("Supabase Storage Delete Error:", storageError.message);
      } else {
        console.log("Successfully deleted audio file from storage:", storageData);
      }
    }

    // 3. Delete meeting row from database 
    // (ON DELETE CASCADE will automatically handle summaries, transcripts, and action_items)
    const { error: deleteError } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meetingId);

    if (deleteError) {
      throw new Error(`Database error: ${deleteError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Meeting, audio file, and all linked summaries deleted.",
    });
  } catch (err: unknown) {
    console.error("Delete Endpoint Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}