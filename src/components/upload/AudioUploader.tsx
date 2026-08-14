"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Upload, Square, Play, Pause, RotateCcw, ArrowRight, Loader2, Sparkles, AlertCircle, FileAudio, Check } from "lucide-react";
import { JBitMascot } from "@/components/brand/jbit-mascot";

export default function AudioUploader() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"record" | "upload">("record");
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Live Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Drag & drop file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [previewAudioUrl]);

  // Audio visualization loop
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#2A1810";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 32) - 2;
      let x = 2;

      for (let i = 0; i < 32; i++) {
        const value = dataArray[i * 2] || 0;
        const barHeight = Math.max(4, (value / 255) * (canvas.height - 8));

        // Warm gradient: amber to cinnamon
        ctx.fillStyle = i % 2 === 0 ? "#E59756" : "#D97724";
        ctx.beginPath();
        ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight, 2);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();
  };

  // Start live recording with visualizer
  const startRecording = async () => {
    setError(null);
    setRecordedBlob(null);
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Setup audio analyzer for wave visualization
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setPreviewAudioUrl(url);

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      drawWaveform();
    } catch {
      setError("Microphone access was denied or is not available. Please verify browser permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
    setPreviewAudioUrl(null);
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
    } else {
      previewAudioRef.current.play().catch(() => {});
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  // Upload & Process pipeline
  const handleProcess = async (fileToUpload: File) => {
    setError(null);
    setIsProcessing(true);
    setProcessingStatus("Uploading recording to secure storage...");

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("title", title.trim() || (activeTab === "record" ? `Recorded Meeting (${new Date().toLocaleDateString()})` : fileToUpload.name.replace(/\.[^/.]+$/, "")));

    try {
      // 1. Upload
      const uploadRes = await fetch("/api/meetings/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const meetingId = uploadData.meeting?.id;
      if (!meetingId) throw new Error("Failed to retrieve created meeting record");

      // 2. Transcribe
      setProcessingStatus("Transcribing with Groq Speech-to-Text...");
      const transcribeRes = await fetch(`/api/meetings/${meetingId}/transcribe`, {
        method: "POST",
      });

      const transcribeData = await transcribeRes.json();
      if (!transcribeRes.ok) {
        throw new Error(transcribeData.error || "Transcription failed");
      }

      // 3. Summarize automatically
      setProcessingStatus("Generating AI summary & action items...");
      await fetch(`/api/meetings/${meetingId}/summarize`, {
        method: "POST",
      }).catch(() => {});

      // Navigate to detail page
      router.push(`/meetings/${meetingId}`);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Processing failed";
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const submitRecording = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
      type: "audio/webm",
    });
    handleProcess(file);
  };

  const submitFile = () => {
    if (!selectedFile) return;
    handleProcess(selectedFile);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-[#E6D7C7] bg-[#FFFFFF] p-7 shadow-sm">
      {/* Header with J-Bit Mascot */}
      <div className="flex items-center justify-between pb-5 border-b border-[#E6D7C7]">
        <div className="flex items-center gap-3">
          <JBitMascot size="sm" glow />
          <div>
            <h2 className="text-lg font-bold text-[#22150E]">New Meeting Recording</h2>
            <p className="text-xs text-[#8A7264]">Record live microphone audio or upload a media file</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl text-xs font-medium text-red-700 bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Meeting Title Input */}
      <div className="mt-5 mb-4">
        <label className="block text-xs font-semibold text-[#22150E] mb-1.5">
          Meeting Title (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Q3 Roadmap Review, Client Discovery, Sprint Retro..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isProcessing || isRecording}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C7] bg-[#FAF6F0] text-sm text-[#22150E] placeholder:text-[#8A7264] focus:outline-none focus:ring-2 focus:ring-[#B85414] disabled:opacity-60 transition"
        />
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F6EEE5] border border-[#E6D7C7] mb-5">
        <button
          type="button"
          onClick={() => {
            if (!isRecording && !isProcessing) setActiveTab("record");
          }}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "record"
              ? "bg-[#FFFFFF] text-[#22150E] shadow-xs"
              : "text-[#6E584C] hover:text-[#22150E]"
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-[#B85414]" />
          Live Microphone
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isRecording && !isProcessing) setActiveTab("upload");
          }}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "upload"
              ? "bg-[#FFFFFF] text-[#22150E] shadow-xs"
              : "text-[#6E584C] hover:text-[#22150E]"
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-[#B85414]" />
          Upload Audio File
        </button>
      </div>

      {/* TAB 1: Live Microphone Recording */}
      {activeTab === "record" && (
        <div className="space-y-4">
          {/* Retro CRT Recording Screen */}
          <div className="rounded-2xl bg-[#2A1810] border-2 border-[#523324] p-5 text-center flex flex-col items-center justify-center shadow-inner min-h-[170px] relative overflow-hidden">
            {isRecording ? (
              <div className="w-full flex flex-col items-center space-y-3 z-10">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={50}
                  className="rounded-lg bg-[#2A1810]"
                />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xl font-mono font-bold text-[#E59756] tracking-wider">
                    {formatTime(recordingTime)}
                  </span>
                  {isPaused && (
                    <span className="text-xs font-mono uppercase bg-[#3C2317] text-amber-300 px-2 py-0.5 rounded border border-[#523324]">
                      PAUSED
                    </span>
                  )}
                </div>
              </div>
            ) : recordedBlob && previewAudioUrl ? (
              <div className="w-full flex flex-col items-center space-y-3 z-10">
                <audio
                  ref={previewAudioRef}
                  src={previewAudioUrl}
                  onEnded={() => setIsPreviewPlaying(false)}
                />
                <div className="text-xs text-[#D4C0AE] font-mono">
                  Recording captured: <span className="text-[#E59756] font-bold">{formatTime(recordingTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePreviewPlay}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E59756] hover:bg-[#D97724] text-[#2A1810] text-xs font-bold shadow transition"
                  >
                    {isPreviewPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isPreviewPlaying ? "Pause Preview" : "Play Preview"}
                  </button>
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#3C2317] text-[#D4C0AE] hover:text-white text-xs font-medium border border-[#523324] transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Re-record
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#3C2317] flex items-center justify-center text-[#E59756] border border-[#523324]">
                  <Mic className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#D4C0AE] max-w-xs">
                  Press the record button below to capture in-person meetings or thoughts directly in browser.
                </p>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isRecording && !recordedBlob && (
              <button
                type="button"
                onClick={startRecording}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#B85414] hover:bg-[#9C430C] text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </button>
            )}

            {isRecording && (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="px-4 py-2.5 rounded-xl border border-[#E6D7C7] bg-[#FFFFFF] text-xs font-semibold text-[#22150E] hover:bg-[#F6EEE5] transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-[#B85414] fill-current" />
                    Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="px-4 py-2.5 rounded-xl border border-[#E6D7C7] bg-[#FFFFFF] text-xs font-semibold text-[#22150E] hover:bg-[#F6EEE5] transition flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5 text-[#B85414] fill-current" />
                    Pause
                  </button>
                )}

                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop & Review
                </button>
              </>
            )}

            {recordedBlob && !isRecording && (
              <button
                type="button"
                onClick={submitRecording}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#B85414] hover:bg-[#9C430C] text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{processingStatus || "Processing AI Transcript..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Save & Generate Recap
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: File Upload */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-[#E6D7C7] hover:border-[#B85414] rounded-2xl p-7 text-center transition-colors bg-[#FAF6F0] relative cursor-pointer">
            <input
              type="file"
              accept="audio/*,video/mp4"
              disabled={isProcessing}
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              id="file-upload-input"
            />
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-[#F6EEE5] text-[#B85414] flex items-center justify-center">
                <FileAudio className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#22150E]">
                {selectedFile ? selectedFile.name : "Click or drag audio file here"}
              </p>
              <p className="text-xs text-[#8A7264]">
                Supports MP3, WAV, M4A, WebM, AAC, MP4 up to 50MB
              </p>
              {selectedFile && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Check className="w-3 h-3" />
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB selected
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={submitFile}
            disabled={!selectedFile || isProcessing}
            className="w-full py-3 rounded-xl bg-[#B85414] hover:bg-[#9C430C] text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{processingStatus || "Processing..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Upload & Process Meeting
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
