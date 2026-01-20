"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BatteryMedium,
  Camera as CameraIcon,
  Loader2,
  Mic,
  Volume2,
} from "lucide-react";
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CLASSNAME_BY_STATUS } from "../constants";
import type { CameraRef, CameraStatus } from "../types";
import type { TranscriptionStatus } from "../hooks/use-realtime-transcription";
import { ListeningOverlay } from "./listening-overlay";

type CameraProps = {
  className?: string;
  ref?: Ref<CameraRef>;
  status: CameraStatus;
  onStatusChange: (status: CameraStatus) => void;
  snapshot?: string | null;
  grayscale?: boolean;
  overlay?: React.ReactNode;
  transcriptionStatus?: TranscriptionStatus;
  isListening?: boolean;
  onToggleListening?: () => void;
};

export function Camera({
  className,
  ref,
  status,
  onStatusChange,
  snapshot,
  grayscale,
  overlay,
  transcriptionStatus,
  isListening,
  onToggleListening,
}: CameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVolumeAcknowledged, setIsVolumeAcknowledged] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream && status === "active") {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, status]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "active") {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [status]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
      const video = videoRef.current;
      if (!video || status !== "active") return null;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.8);
    },
  }));

  async function requestPermissions() {
    if (status !== "idle") return;

    onStatusChange("requesting");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      onStatusChange("active");
    } catch {
      onStatusChange("error");
    }
  }

  return (
    <Card
      className={cn(
        "aspect-video overflow-hidden p-0 border-4",
        CLASSNAME_BY_STATUS[status],
        className,
      )}
      hoverable={status === "idle"}
      onClick={
        status === "idle"
          ? isVolumeAcknowledged
            ? requestPermissions
            : () => setIsVolumeAcknowledged(true)
          : undefined
      }
    >
      {status === "idle" &&
        (isVolumeAcknowledged ? (
          <CardContent className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <div className="flex gap-3">
              <CameraIcon className="size-12" />
              <Mic className="size-12" />
            </div>
            <p className="text-center">Click to enable camera and microphone</p>
          </CardContent>
        ) : (
          <CardContent className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Volume2 className="size-12" />
            <p className="text-center">
              Turn your volume up for the best experience. Click to continue.
            </p>
          </CardContent>
        ))}

      {status === "requesting" && (
        <CardContent className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <Loader2 className="size-12 animate-spin" />
          <p className="text-center">Waiting for permissions...</p>
        </CardContent>
      )}

      {status === "error" && (
        <CardContent className="flex flex-col items-center justify-center h-full gap-3 text-destructive">
          <AlertCircle className="size-12" />
          <p className="text-center">
            Camera access was denied. Please enable permissions in your browser
            settings.
          </p>
        </CardContent>
      )}

      {status === "active" && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              filter: [
                grayscale ? "grayscale(1)" : "",
                "sepia(0.05) saturate(0.8) contrast(1.05) brightness(0.95) blur(0.5px)",
              ]
                .join(" ")
                .trim(),
            }}
          />
          {/* Vignette */}
          <div className="pointer-events-none absolute inset-0 shadow-vignette" />

          {/* Rectangular Corners */}
          <div className="absolute left-4 top-4 h-4 w-4 border-l-2 border-t-2 border-white" />
          <div className="absolute right-4 top-4 h-4 w-4 border-r-2 border-t-2 border-white" />
          <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-white" />
          <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-white" />

          {/* Live Indicator */}
          <div className="absolute bg-black/70 left-8 top-8 px-3 py-2 flex items-center gap-1 rounded-md text-base font-semibold uppercase">
            <div className="h-2 w-2 animate-caret-blink rounded-full bg-red-600" />
            Rec
          </div>

          {/* Timer */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-black/50 px-2 py-1 text-xs font-semibold text-white">
            {formatTime(elapsedTime)}
          </div>

          {transcriptionStatus && (
            <ListeningOverlay
              status={transcriptionStatus}
              isListening={isListening ?? true}
              onToggle={onToggleListening}
            />
          )}

          {overlay}
        </div>
      )}

      {status === "frozen" && snapshot && (
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={snapshot}
            alt="Frozen camera snapshot"
            className={cn(
              "w-full h-full object-cover transition-all duration-1000",
              grayscale && "grayscale",
            )}
          />
          {overlay}
        </div>
      )}
    </Card>
  );
}
