import { getCurrentUser } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { MeetingActions } from "@/components/meetings/MeetingActions";
import { DashboardPoller } from "@/components/meetings/DashboardPoller";
import { DeleteMeetingButton } from "@/components/meetings/DeleteMeetingButton";
import { JBitMascot } from "@/components/brand/jbit-mascot";
import { formatDuration, formatMeetingDate } from "@/lib/utils/formatters";
import type { Meeting } from "@/types/database";
import { Plus, Mic, CheckCircle2, Clock, Sparkles } from "lucide-react";

export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let meetingList: Meeting[] = [];

  try {
    const supabase = await createClient();
    const { data: meetings, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && meetings) {
      meetingList = meetings as Meeting[];
    }
  } catch {
    meetingList = [];
  }

  // Summary counts
  const totalCount = meetingList.length;
  const completedCount = meetingList.filter((m) => m.status === "done").length;
  const inProgressCount = meetingList.filter(
    (m) => m.status === "summarizing" || m.status === "transcribing"
  ).length;

  const hasInProgressMeetings = inProgressCount > 0;

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[#FBF8F3]">
      <SiteHeader />

      {/* Auto-refreshes when a status is in progress */}
      <DashboardPoller hasInProgressMeetings={hasInProgressMeetings} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* Top Header Section */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E6D7C7] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-[#F4E8DB] px-2 py-0.5 text-xs font-mono font-medium text-[#8A4315] border border-[#E5D2BE]">
                BreviAI
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#22150E]">
              Meeting Dashboard
            </h1>
            <p className="mt-1 text-xs text-[#8A7264]">
              Manage your audio recordings, transcripts, summaries, and action items.
            </p>
          </div>

          <Link
            href="/meetings/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B85414] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#9C430C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Meeting
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#F6EEE5] text-[#B85414]">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8A7264]">Total Meetings</p>
              <p className="text-xl font-bold text-[#22150E]">{totalCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8A7264]">Completed Recaps</p>
              <p className="text-xl font-bold text-[#22150E]">{completedCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8A7264]">In Progress</p>
              <p className="text-xl font-bold text-[#22150E]">{inProgressCount}</p>
            </div>
          </div>
        </div>

        {/* Recent Meetings Card Container */}
        <div className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] shadow-sm overflow-hidden">
          <div className="border-b border-[#F0E4D6] bg-[#FAF6F0] px-6 py-3.5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E584C]">
              Your Meetings & Recordings
            </h2>
            <span className="text-[11px] font-mono text-[#8A7264]">
              {totalCount} {totalCount === 1 ? "record" : "records"}
            </span>
          </div>

          {meetingList.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <JBitMascot size="lg" glow />
              <div className="space-y-1">
                <p className="text-base font-bold text-[#22150E]">No meetings found</p>
                <p className="text-xs text-[#8A7264] max-w-sm">
                  Record live audio directly or upload an existing media file to generate transcripts and executive action items.
                </p>
              </div>
              <Link
                href="/meetings/new"
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#B85414] px-4 py-2 text-xs font-bold text-white hover:bg-[#9C430C] shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Record or Upload Meeting
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#F0E4D6]">
              {meetingList.map((meeting) => (
                <li
                  key={meeting.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-[#FAF6F0] transition-colors group"
                >
                  {/* Left Column: Title & Meta Info */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="text-sm font-bold text-[#22150E] hover:text-[#B85414] transition-colors block truncate"
                    >
                      {meeting.title || "Untitled Meeting"}
                    </Link>
                    <p className="mt-1 text-[11px] text-[#8A7264] flex items-center gap-2">
                      <span>{formatMeetingDate(meeting.created_at)}</span>
                      {meeting.duration_seconds && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{formatDuration(meeting.duration_seconds)}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Right Column: Status, Contextual Actions & Delete */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <MeetingStatusBadge
                      status={meeting.status}
                      meetingId={meeting.id}
                    />

                    <MeetingActions
                      meetingId={meeting.id}
                      status={meeting.status}
                    />

                    <DeleteMeetingButton
                      meetingId={meeting.id}
                      meetingTitle={meeting.title || "this meeting"}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
