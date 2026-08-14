import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { MeetingActions } from "@/components/meetings/MeetingActions";

export const revalidate = 0; // Prevent caching stale meeting states

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch meeting along with transcripts, summaries, and action items
  const { data: meeting, error } = await supabase
    .from("meetings")
    .select(`
      *,
      transcripts (*),
      summaries (*),
      action_items (*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  // Handle both array and object formats returned by Supabase joins
  const transcriptRecord = Array.isArray(meeting.transcripts)
    ? meeting.transcripts[0]
    : meeting.transcripts;

  const summaryRecord = Array.isArray(meeting.summaries)
    ? meeting.summaries[0]
    : meeting.summaries;

  const actionItems = Array.isArray(meeting.action_items)
    ? meeting.action_items
    : [];

  // Fallback check for transcript text column
  const transcriptText =
    transcriptRecord?.full_text ||
    transcriptRecord?.raw_text ||
    null;

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-gray-50/50">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <MeetingActions meetingId={meeting.id} status={meeting.status} />
        </div>

        {/* Meeting Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {meeting.title || "Untitled Meeting"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created on{" "}
              {new Date(meeting.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MeetingStatusBadge status={meeting.status} />
          </div>
        </div>

        <div className="space-y-8">
          {/* Executive Summary Section */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Executive Summary
            </h2>
            {summaryRecord && summaryRecord.executive_summary ? (
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                {summaryRecord.executive_summary}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {meeting.status === "summarizing"
                  ? "Generating summary with Groq Llama 3.3..."
                  : "No summary generated yet."}
              </p>
            )}
          </section>

          {/* Key Topics Section */}
          {summaryRecord?.key_topics && summaryRecord.key_topics.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Key Topics
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {summaryRecord.key_topics.map((topic: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    {topic}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Decisions Section */}
          {summaryRecord?.decisions && summaryRecord.decisions.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Decisions Made
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {summaryRecord.decisions.map((decision: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    {decision}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items Section */}
          {actionItems.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Action Items
              </h2>
              <div className="divide-y divide-gray-100">
                {actionItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.task}
                      </p>
                      <p className="text-xs text-gray-500">
                        Assignee: {item.assignee || "Unassigned"}
                      </p>
                    </div>
                    {item.due_date && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Due: {item.due_date}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Transcript Section */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Audio Transcript
              </h2>
              {transcriptText && (
                <span className="text-xs text-gray-400 font-mono">
                  {transcriptText.trim().split(/\s+/).length} words
                </span>
              )}
            </div>

            {transcriptText ? (
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 max-h-[400px] overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                  {transcriptText}
                </p>
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-sm font-medium text-gray-600">
                  No transcript recorded for this meeting.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}