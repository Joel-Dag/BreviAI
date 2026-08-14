import { createClient } from "@/lib/supabase/server";
import type {
  ActionItem,
  Meeting,
  MeetingStatus,
  MeetingWithRelations,
  Summary,
  Transcript,
} from "@/types/database";

export async function listMeetingsForUser(userId: string): Promise<Meeting[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Meeting[];
}

export async function getMeetingById(
  meetingId: string,
  userId: string,
): Promise<Meeting | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Meeting;
}

export async function getMeetingWithRelations(
  meetingId: string,
  userId: string,
): Promise<MeetingWithRelations | null> {
  const supabase = await createClient();

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("user_id", userId)
    .single();

  if (meetingError || !meeting) {
    return null;
  }

  const [
    { data: transcript },
    { data: summary },
    { data: actionItems },
  ] = await Promise.all([
    supabase.from("transcripts").select("*").eq("meeting_id", meetingId).maybeSingle(),
    supabase.from("summaries").select("*").eq("meeting_id", meetingId).maybeSingle(),
    supabase
      .from("action_items")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    ...(meeting as Meeting),
    transcript: (transcript as Transcript | null) ?? null,
    summary: (summary as Summary | null) ?? null,
    action_items: (actionItems as ActionItem[] | null) ?? [],
  };
}

export async function createMeeting(input: {
  userId: string;
  title?: string;
  audioFilePath?: string | null;
  durationSeconds?: number | null;
  status?: MeetingStatus;
}): Promise<Meeting | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      user_id: input.userId,
      title: input.title ?? "Untitled meeting",
      audio_file_path: input.audioFilePath ?? null,
      duration_seconds: input.durationSeconds ?? null,
      status: input.status ?? "uploading",
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return data as Meeting;
}

export async function updateMeetingStatus(
  meetingId: string,
  userId: string,
  status: MeetingStatus,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("meetings")
    .update({ status })
    .eq("id", meetingId)
    .eq("user_id", userId);

  return !error;
}

export async function countMeetingsThisPeriod(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("period_reset_at")
    .eq("id", userId)
    .single();

  const periodStart = getPeriodStart(profile?.period_reset_at);

  const { count, error } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString())
    .neq("status", "failed");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

function getPeriodStart(periodResetAt: string | undefined | null) {
  if (periodResetAt) {
    const reset = new Date(periodResetAt);
    reset.setUTCMonth(reset.getUTCMonth() - 1);
    return reset;
  }

  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
