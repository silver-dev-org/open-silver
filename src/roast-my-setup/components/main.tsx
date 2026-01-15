"use client";

import { useCallback } from "react";
import { CameraPreview } from "./camera-preview";
import { AudioIndicator } from "./audio-indicator";
import { useAudioListener } from "../hooks/use-audio-listener";

export function RoastMySetup() {
  const { status, audioLevel, startListening } = useAudioListener();

  const handleStreamReady = useCallback(
    (stream: MediaStream) => {
      startListening(stream);
    },
    [startListening],
  );

  return (
    <div className="flex w-full flex-col gap-4 max-w-4xl mx-auto">
      <CameraPreview onStreamReady={handleStreamReady} />
      <AudioIndicator level={audioLevel} isListening={status === "listening"} />
    </div>
  );
}
