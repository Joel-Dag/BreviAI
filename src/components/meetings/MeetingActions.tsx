"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileAudio, RotateCw, Loader2 } from "lucide-react";

interface MeetingActionsProps {
  meetingId: string;
  status: string;
}

export function MeetingActions({ meetingId, status }: MeetingActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const normStatus = (status || "").toLowerCase();

  const handleTranscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/transcribe`, { method: "POST" });
      if (res.ok) {
        router.refresh();
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
        router.refresh();
      }
    } catch (err) {
      console.error("Summarization error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (normStatus === "uploaded" || normStatus === "uploading") {
    return (
      <button
        onClick={handleTranscribe}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#B85414] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#9C430C] shadow-sm transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileAudio className="w-3.5 h-3.5" />}
        {loading ? "Transcribing..." : "Transcribe Audio"}
      </button>
    );
  }

  if (normStatus === "transcribed") {
    return (
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2A1810] px-3 py-1.5 text-xs font-semibold text-[#E59756] hover:bg-[#3C2317] border border-[#523324] shadow-sm transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E59756]" /> : <Sparkles className="w-3.5 h-3.5 text-[#E59756]" />}
        {loading ? "Summarizing..." : "Generate AI Summary"}
      </button>
    );
  }

  if (normStatus === "failed") {
    return (
      <button
        onClick={handleTranscribe}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
        {loading ? "Retrying..." : "Retry Processing"}
      </button>
    );
  }

  return null;
}
