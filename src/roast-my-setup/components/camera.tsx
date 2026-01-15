"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle, Camera as CameraIcon, Loader2, Mic } from "lucide-react";
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { BORDER_BY_STATUS } from "../constants";
import type { CameraRef, CameraStatus } from "../types";

type CameraProps = {
  className?: string;
  ref?: Ref<CameraRef>;
  status: CameraStatus;
  onStatusChange: (status: CameraStatus) => void;
};

export function Camera({
  className,
  ref,
  status,
  onStatusChange,
}: CameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
        BORDER_BY_STATUS[status],
        className,
      )}
      hoverable={status === "idle"}
      onClick={status === "idle" ? requestPermissions : undefined}
    >
      {status === "idle" && (
        <CardContent className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <div className="flex gap-3">
            <CameraIcon className="size-12" />
            <Mic className="size-12" />
          </div>
          <p className="text-center">Click to enable camera and microphone</p>
        </CardContent>
      )}

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

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "w-full h-full object-cover",
          status !== "active" && "hidden",
        )}
      />
    </Card>
  );
}
