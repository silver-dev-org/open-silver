"use client";

import { cn } from "@/lib/utils";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import type { TranscriptionStatus } from "../hooks/use-realtime-transcription";

type AudioOverlayProps = {
  stream: MediaStream;
  status: TranscriptionStatus;
  isListening: boolean;
  onToggle?: () => void;
  onMutedSpeaking?: () => void;
};

const BAR_COUNT = 8;

export function AudioOverlay({
  stream,
  status,
  isListening,
  onToggle,
  onMutedSpeaking,
}: AudioOverlayProps) {
  const [activeBars, setActiveBars] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasShownMutedToast = useRef<boolean>(false);
  const lastAlertTime = useRef<number>(0);
  const detectionCount = useRef<number>(0);

  useEffect(() => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function updateLevel() {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;

      const normalized = Math.min(average / 128, 1);
      const bars = Math.round(normalized * BAR_COUNT);

      setActiveBars(bars);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    }

    updateLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [stream]);

  // Detect speaking while muted
  useEffect(() => {
    // Only detect when muted (not listening) and have significant audio activity
    if (isListening || activeBars < 3 || status !== "listening") return;

    const now = Date.now();
    // Debounce: only alert once every 3 seconds
    if (now - lastAlertTime.current < 3000) return;

    lastAlertTime.current = now;
    detectionCount.current += 1;

    if (!hasShownMutedToast.current) {
      // First detection - show message box
      onMutedSpeaking?.();
      hasShownMutedToast.current = true;

      posthog.capture("roast_me_muted_speaking_detected", {
        detection_count: detectionCount.current,
        alert_type: "message_box",
      });
    } else {
      // Subsequent detections - pulse button
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);

      posthog.capture("roast_me_muted_speaking_detected", {
        detection_count: detectionCount.current,
        alert_type: "pulse",
      });
    }
  }, [activeBars, isListening, status]);

  // Reset toast flag when user unmutes
  useEffect(() => {
    if (isListening) {
      hasShownMutedToast.current = false;
    }
  }, [isListening]);

  if (status === "idle") return null;

  const MicIcon = isListening ? Mic : MicOff;

  return (
    <button
      onClick={onToggle}
      disabled={status === "connecting"}
      className={cn(
        "absolute right-8 top-8 text-sm flex items-center gap-2 rounded-md bg-black/50 px-3 py-2 font-semibold text-white backdrop-blur-sm transition-all cursor-pointer hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-70",
        isPulsing && "animate-micPulse",
      )}
    >
      {status === "connecting" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting...</span>
        </>
      )}

      {status === "listening" && (
        <>
          <div className="relative flex items-center justify-center">
            <MicIcon
              className={cn(
                "h-4 w-4",
                isListening ? "text-white" : "text-warning",
              )}
            />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-5 rounded-sm transition-colors duration-100",
                  isListening
                    ? i < activeBars
                      ? "bg-white"
                      : "bg-white/30"
                    : "bg-warning",
                )}
              />
            ))}
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <MicOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Error</span>
        </>
      )}
    </button>
  );
}
