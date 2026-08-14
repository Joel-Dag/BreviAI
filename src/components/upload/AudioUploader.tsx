"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AudioUploader() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // File Upload + Automatic Transcription Handler
  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProcessingStatus("Uploading file...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim() || file.name.replace(/\.[^/.]+$/, ""));

    try {
      // 1. Upload file to Supabase Storage
      const uploadRes = await fetch("/api/meetings/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const meetingId = uploadData.meeting?.id;
      if (!meetingId) throw new Error("Failed to retrieve created meeting ID");

      // 2. Trigger automatic Groq transcription
      setProcessingStatus("Transcribing audio...");
      const transcribeRes = await fetch(`/api/meetings/${meetingId}/transcribe`, {
        method: "POST",
      });

      const transcribeData = await transcribeRes.json();
      if (!transcribeRes.ok) {
        throw new Error(transcribeData.error || "Transcription failed");
      }

      // Successfully processed — route back to dashboard
      router.push(`/dashboard`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during processing");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Live Browser Recording Handlers
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const recordedFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        await handleFileUpload(recordedFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">New Meeting Recording</h2>

      {error && <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title (Optional)</label>
        <input
          type="text"
          placeholder="e.g. Q3 Product Planning"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isProcessing || isRecording}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer mb-4">
        <input
          type="file"
          accept="audio/*,video/mp4"
          disabled={isProcessing || isRecording}
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
          className="hidden"
          id="audio-file-input"
        />
        <label htmlFor="audio-file-input" className="cursor-pointer block">
          <p className="text-sm text-gray-600 font-medium">
            {isProcessing ? processingStatus : "Click or drag audio file here (mp3, wav, m4a, mp4)"}
          </p>
        </label>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-sm font-medium text-gray-500">Or record live:</span>
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            Start Recording
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-red-600 font-mono animate-pulse">
              ● Recording {formatTime(recordingTime)}
            </span>
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition"
            >
              Stop & Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}