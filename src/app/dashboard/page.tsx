import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { MeetingActions } from "@/components/meetings/MeetingActions";
import { DashboardPoller } from "@/components/meetings/DashboardPoller";
import { formatDuration, formatMeetingDate } from "@/lib/utils/formatters";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch recent meetings ordered by creation date
  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading meetings:", error);
  }

  const meetingList = meetings || [];

  // Check if any meeting is currently in progress so the poller knows whether to check for updates
  const hasInProgressMeetings = meetingList.some(
    (m) => m.status === "summarizing" || m.status === "transcribing"
  );

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-gray-50/50">
      <SiteHeader />
      
      {/* Auto-refreshes the server component when a status is in progress */}
      <DashboardPoller hasInProgressMeetings={hasInProgressMeetings} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {/* Top Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your meeting recordings, transcriptions, and summaries.
            </p>
          </div>
          <Link
            href="/meetings/new"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            + New Meeting
          </Link>
        </div>

        {/* Recent Meetings Card Container */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent meetings
            </h2>
          </div>

          {meetingList.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-500">No meetings found.</p>
              <Link
                href="/meetings/new"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Upload or record your first meeting →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {meetingList.map((meeting) => (
                <li
                  key={meeting.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50/80 transition-colors"
                >
                  {/* Left Column: Title & Meta Info */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors block truncate"
                    >
                      {meeting.title || "Untitled Meeting"}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                      <span>{formatMeetingDate(meeting.created_at)}</span>
                      {meeting.duration && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(meeting.duration)}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Right Column: Status & Contextual Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status Badge (Converts to "View Summary →" button when completed) */}
                    <MeetingStatusBadge
                      status={meeting.status}
                      meetingId={meeting.id}
                    />

                    {/* Context Action ("Transcribe Now", "Summarize Now", or disappears) */}
                    <MeetingActions
                      meetingId={meeting.id}
                      status={meeting.status}
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