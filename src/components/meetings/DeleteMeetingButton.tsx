"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteMeeting } from "@/lib/meetings/actions";
import { useRouter } from "next/navigation";

interface DeleteMeetingButtonProps {
  meetingId: string;
  meetingTitle?: string;
  redirectToDashboard?: boolean;
}

export function DeleteMeetingButton({
  meetingId,
  meetingTitle = "this meeting",
  redirectToDashboard = false,
}: DeleteMeetingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMeeting(meetingId);
      setIsOpen(false);
      if (redirectToDashboard) {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      console.error("Delete meeting failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-[#8A7264] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete meeting"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#22150E]">Delete Meeting?</h3>
            </div>

            <p className="text-xs text-[#6E584C] leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-[#22150E]">&quot;{meetingTitle}&quot;</span>? This will permanently delete the audio recording, transcript, summary, and all action items.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-lg border border-[#E6D7C7] text-xs font-semibold text-[#6E584C] hover:bg-[#F6EEE5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
