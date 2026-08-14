import { getCurrentUser } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { MeetingActions } from "@/components/meetings/MeetingActions";
import { AudioPlayer } from "@/components/meetings/AudioPlayer";
import { ActionItemsList } from "@/components/meetings/ActionItemsList";
import { ExportShareMenu } from "@/components/meetings/ExportShareMenu";
import { DeleteMeetingButton } from "@/components/meetings/DeleteMeetingButton";
import { ArrowLeft, Sparkles, CheckCircle2, ListFilter, FileText } from "lucide-react";

export const revalidate = 0;

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  // Fetch meeting with joined transcripts, summaries, and action items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let meeting: any = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
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

    if (!error && data) {
      meeting = data;
    }
  } catch {
    meeting = null;
  }

  if (!meeting) {
    notFound();
  }

  // Normalize relational records
  const transcriptRecord = Array.isArray(meeting.transcripts)
    ? meeting.transcripts[0]
    : meeting.transcripts;

  const summaryRecord = Array.isArray(meeting.summaries)
    ? meeting.summaries[0]
    : meeting.summaries;

  const actionItems = Array.isArray(meeting.action_items)
    ? meeting.action_items
    : [];

  const transcriptText =
    transcriptRecord?.full_text ||
    transcriptRecord?.raw_text ||
    null;

  const formattedDate = new Date(meeting.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[#FBF8F3]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {/* Top Navigation & Action Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A7264] hover:text-[#22150E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2.5">
            <MeetingActions meetingId={meeting.id} status={meeting.status} />
            <ExportShareMenu
              meeting={{
                id: meeting.id,
                title: meeting.title || "Meeting Notes",
                created_at: meeting.created_at,
                status: meeting.status,
                duration_seconds: meeting.duration_seconds,
              }}
              summary={summaryRecord}
              actionItems={actionItems}
              transcript={transcriptText}
            />
            <DeleteMeetingButton
              meetingId={meeting.id}
              meetingTitle={meeting.title || "this meeting"}
              redirectToDashboard
            />
          </div>
        </div>

        {/* Meeting Hero Banner */}
        <div className="mb-6 rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-[#B85414] uppercase tracking-wider">
                  Meeting Recap
                </span>
                <span className="text-[#D4C0AE]">•</span>
                <span className="text-xs text-[#8A7264]">{formattedDate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#22150E]">
                {meeting.title || "Untitled Meeting"}
              </h1>
            </div>
            <div className="shrink-0">
              <MeetingStatusBadge status={meeting.status} />
            </div>
          </div>

          {/* Inline Audio Player if audio recording exists */}
          {meeting.audio_file_path && (
            <div className="mt-5 pt-5 border-t border-[#F0E4D6]">
              <AudioPlayer
                meetingId={meeting.id}
                durationSeconds={meeting.duration_seconds}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Executive Summary Section */}
          <section className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-[#F0E4D6]">
              <div className="p-2 rounded-xl bg-[#F6EEE5] text-[#B85414]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#22150E]">
                Executive Summary
              </h2>
            </div>

            {summaryRecord?.executive_summary ? (
              <p className="text-[#433127] leading-relaxed text-sm whitespace-pre-wrap">
                {summaryRecord.executive_summary}
              </p>
            ) : (
              <div className="py-6 text-center text-xs text-[#8A7264] italic">
                {meeting.status === "summarizing"
                  ? "Generating executive summary with AI..."
                  : "No executive summary available yet. Click 'Generate AI Summary' above."}
              </div>
            )}
          </section>

          {/* Two Column Grid: Key Topics & Decisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Topics */}
            <section className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F0E4D6]">
                <div className="p-1.5 rounded-lg bg-[#FAF6F0] text-[#B85414] border border-[#E6D7C7]">
                  <ListFilter className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-[#22150E]">
                  Key Topics Discussed
                </h2>
              </div>

              {summaryRecord?.key_topics && summaryRecord.key_topics.length > 0 ? (
                <ul className="space-y-2 text-xs text-[#433127]">
                  {summaryRecord.key_topics.map((topic: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B85414] mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{topic}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#8A7264] italic">No topics extracted.</p>
              )}
            </section>

            {/* Decisions Made */}
            <section className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F0E4D6]">
                <div className="p-1.5 rounded-lg bg-[#FAF6F0] text-emerald-700 border border-[#E6D7C7]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-[#22150E]">
                  Key Decisions
                </h2>
              </div>

              {summaryRecord?.decisions && summaryRecord.decisions.length > 0 ? (
                <ul className="space-y-2 text-xs text-[#433127]">
                  {summaryRecord.decisions.map((decision: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{decision}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#8A7264] italic">No decisions recorded.</p>
              )}
            </section>
          </div>

          {/* Interactive Action Items Suite */}
          <ActionItemsList
            meetingId={meeting.id}
            initialItems={actionItems}
          />

          {/* Transcript Section */}
          <section className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0E4D6]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#B85414]" />
                <h2 className="text-base font-bold text-[#22150E]">
                  Full Audio Transcript
                </h2>
              </div>
              {transcriptText && (
                <span className="text-[11px] text-[#8A7264] font-mono">
                  {transcriptText.trim().split(/\s+/).length} words
                </span>
              )}
            </div>

            {transcriptText ? (
              <div className="rounded-xl bg-[#FAF6F0] p-4 border border-[#E6D7C7] max-h-[350px] overflow-y-auto">
                <p className="whitespace-pre-wrap text-xs text-[#433127] leading-relaxed font-sans">
                  {transcriptText}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center bg-[#FAF6F0] rounded-xl border border-dashed border-[#E6D7C7]">
                <p className="text-xs text-[#8A7264]">
                  {meeting.status === "transcribing"
                    ? "Transcribing speech into text..."
                    : "No transcript recorded for this meeting yet."}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
