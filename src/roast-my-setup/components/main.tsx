"use client";

import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import type {
  AnalyzeSetupRequest,
  AnalyzeSetupResponse,
  CameraPreviewHandle,
} from "../types";
import { CameraPreview } from "./camera-preview";

export function RoastMySetup() {
  const cameraRef = useRef<CameraPreviewHandle>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const snapshot = cameraRef.current?.captureSnapshot();
      if (!snapshot) {
        throw new Error("Failed to capture snapshot");
      }

      const body: AnalyzeSetupRequest = { snapshot };
      const response = await fetch("/roast-my-setup/api/analyze-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("Failed to analyze setup");
      }
      return response.json() as Promise<AnalyzeSetupResponse>;
    },
  });

  return (
    <div className="flex w-full flex-col gap-4 max-w-4xl mx-auto">
      <CameraPreview ref={cameraRef} />
      <Button
        onClick={() => mutate()}
        size="lg"
        className="self-center"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Roasting...
          </>
        ) : (
          "Roast me"
        )}
      </Button>
    </div>
  );
}
