import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id: meetingId } = await params;
  const supabase = await createClient();

  // 1. Fetch meeting, summary, transcript, and action items
  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (!meeting) return notFound();

  const { data: summary } = await supabase
    .from("summaries")
    .select("*")
    .eq("meeting_id", meetingId)
    .single();

  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*")
    .eq("meeting_id", meetingId);

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("meeting_id", meetingId)
    .single();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">{meeting.title}</h1>
        <p className="text-sm text-gray-500">
          Status: <span className="capitalize font-semibold text-green-600">{meeting.status}</span>
        </p>
      </div>

      {/* Overview Card */}
      {summary?.overview && (
        <section className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Executive Summary</h2>
          <p className="text-gray-700 leading-relaxed">{summary.overview}</p>
        </section>
      )}

      {/* Key Takeaways */}
      {summary?.key_takeaways?.length > 0 && (
        <section className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Takeaways</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {summary.key_takeaways.map((point: string, idx: number) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Action Items */}
      {actionItems && actionItems.length > 0 && (
        <section className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h2>
          <div className="divide-y divide-gray-100">
            {actionItems.map((item: any) => (
              <div key={item.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.task}</p>
                  <p className="text-xs text-gray-500">Assignee: {item.assignee}</p>
                </div>
                {item.due_date && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                    Due: {item.due_date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full Transcript */}
      {transcript?.full_text && (
        <details className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <summary className="font-semibold text-gray-800 cursor-pointer">
            View Full Transcript
          </summary>
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {transcript.full_text}
          </p>
        </details>
      )}
    </div>
  );
}