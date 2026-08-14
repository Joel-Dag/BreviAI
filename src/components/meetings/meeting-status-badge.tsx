"use client";

import Link from "next/link";

// --- Date & Duration Helpers ---
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatMeetingDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Component ---
interface MeetingStatusBadgeProps {
  status: string;
  meetingId?: string; // Optional so pages without meetingId won't throw TS errors
}

export function MeetingStatusBadge({ status, meetingId }: MeetingStatusBadgeProps) {
  switch (status) {
    case "uploaded":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          Uploaded
        </span>
      );

    case "transcribing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Transcribing...
        </span>
      );

    case "transcribed":
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
          Transcribed
        </span>
      );

    case "summarizing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
          Summarizing...
        </span>
      );

    case "completed":
      if (meetingId) {
        return (
          <Link
            href={`/meetings/${meetingId}`}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 transition-colors"
          >
            View Summary →
          </Link>
        );
      }
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Completed
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {status}
        </span>
      );
  }
}