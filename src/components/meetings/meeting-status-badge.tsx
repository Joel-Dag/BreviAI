"use client";

import Link from "next/link";
import { CheckCircle2, Clock, Loader2, AlertCircle, FileAudio, Sparkles } from "lucide-react";

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
  meetingId?: string;
}

export function MeetingStatusBadge({ status, meetingId }: MeetingStatusBadgeProps) {
  const normStatus = (status || "").toLowerCase();

  switch (normStatus) {
    case "uploaded":
    case "uploading":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6EEE5] px-2.5 py-1 text-xs font-semibold text-[#8A4315] border border-[#E6D7C7]">
          <FileAudio className="w-3 h-3 text-[#B85414]" />
          Uploaded
        </span>
      );

    case "transcribing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
          Transcribing...
        </span>
      );

    case "transcribed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
          <Clock className="w-3 h-3 text-indigo-600" />
          Transcribed
        </span>
      );

    case "summarizing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 border border-purple-200">
          <Sparkles className="w-3 h-3 animate-pulse text-purple-600" />
          Summarizing...
        </span>
      );

    case "done":
    case "completed":
      if (meetingId) {
        return (
          <Link
            href={`/meetings/${meetingId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            View Summary →
          </Link>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );

    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
          <AlertCircle className="w-3 h-3 text-red-600" />
          Failed
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center rounded-full bg-[#FAF6F0] px-2.5 py-1 text-xs font-medium text-[#6E584C] border border-[#E6D7C7]">
          {status}
        </span>
      );
  }
}
