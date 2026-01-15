"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraStatus } from "../types";

export function CameraPreview({
  onStreamReady,
  className,
}: {
  onStreamReady?: (stream: MediaStream) => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const startCamera = useCallback(async () => {
    setStatus("requesting");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStatus("active");
      onStreamReady?.(stream);
    } catch (err) {
      setStatus("error");
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setErrorMessage(
            "Access denied. Please allow camera and audio access in your browser settings.",
          );
        } else if (err.name === "NotFoundError") {
          setErrorMessage("No camera found on this device.");
        } else {
          setErrorMessage(err.message);
        }
      }
    }
  }, [onStreamReady]);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      {/* Spacer to maintain 16:9 aspect ratio */}
      <div className="aspect-video" />

      {status === "requesting" && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <p className="text-muted-foreground">Requesting camera access...</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
          <p className="text-center text-destructive">{errorMessage}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          status !== "active" && "pointer-events-none opacity-0",
        )}
      />
    </div>
  );
}
