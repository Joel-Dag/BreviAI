"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  meetingId: string;
  durationSeconds?: number | null;
}

export function AudioPlayer({ meetingId, durationSeconds }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAudio() {
      try {
        setLoading(true);
        const res = await fetch(`/api/meetings/${meetingId}/audio`);
        if (!res.ok) {
          throw new Error("Could not retrieve audio stream");
        }
        const data = await res.json();
        if (isMounted) {
          if (data.audioUrl) {
            setAudioUrl(data.audioUrl);
          } else {
            setError("No audio recording found.");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load audio");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAudio();
    return () => {
      isMounted = false;
    };
  }, [meetingId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#E6D7C7] bg-[#FFFFFF] p-4 flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-[#F6EEE5]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#F6EEE5] rounded w-1/3" />
          <div className="h-2 bg-[#F6EEE5] rounded w-full" />
        </div>
      </div>
    );
  }

  if (error || !audioUrl) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#E6D7C7] bg-gradient-to-r from-[#FFFFFF] to-[#FAF6F0] p-4 shadow-sm">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Controls: Play/Pause, Skips */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => skipTime(-5)}
            className="p-2 text-[#6E584C] hover:text-[#22150E] hover:bg-[#F6EEE5] rounded-lg transition-colors"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-[#B85414] hover:bg-[#9C430C] text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            title={isPlaying ? "Pause" : "Play Recording"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipTime(5)}
            className="p-2 text-[#6E584C] hover:text-[#22150E] hover:bg-[#F6EEE5] rounded-lg transition-colors"
            title="Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Scrubber & Timestamps */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="text-xs font-mono text-[#6E584C] min-w-[36px] text-right">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[#E6D7C7] rounded-lg appearance-none cursor-pointer accent-[#B85414]"
            />
          </div>

          <span className="text-xs font-mono text-[#8A7264] min-w-[36px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Speed & Mute controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-md text-xs font-mono font-medium bg-[#F6EEE5] text-[#8A4315] hover:bg-[#ECDCCB] border border-[#E6D7C7] transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-[#6E584C] hover:text-[#22150E] hover:bg-[#F6EEE5] rounded-lg transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
