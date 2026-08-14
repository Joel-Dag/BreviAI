"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/profile";
import { revalidatePath } from "next/cache";

/**
 * Delete a meeting and its associated file from Supabase Storage and database
 */
export async function deleteMeeting(meetingId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  // 1. Fetch meeting to get audio file path
  const { data: meeting } = await supabase
    .from("meetings")
    .select("audio_file_path")
    .eq("id", meetingId)
    .eq("user_id", user.id)
    .single();

  if (meeting?.audio_file_path) {
    // Delete from Supabase storage bucket
    await supabase.storage
      .from("meeting-audio")
      .remove([meeting.audio_file_path]);
  }

  // 2. Delete meeting row from database (cascade deletes transcripts, summaries, action_items)
  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

