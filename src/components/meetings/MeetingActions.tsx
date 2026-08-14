"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MeetingActionsProps {
  meetingId: string;
  status: string;
}

export function MeetingActions({ meetingId, status }: MeetingActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleTranscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/transcribe`, { method: "POST" });
      if (res.ok) {
        router.refresh(); // Tells Next.js to re-fetch Server Components (Dashboard data)
      }
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/summarize`, { method: "POST" });
      if (res.ok) {
        router.refresh(); // Tells Next.js to re-fetch Server Components (Dashboard data)
      }
    } catch (err) {
      console.error("Summarization error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "uploaded") {
    return (
      <button
        onClick={handleTranscribe}
        disabled={loading}
        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
      >
        {loading ? "Transcribing..." : "Transcribe Now"}
      </button>
    );
  }

  if (status === "transcribed") {
    return (
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50"
      >
        {loading ? "Summarizing..." : "Summarize Now"}
      </button>
    );
  }

  return null;
}