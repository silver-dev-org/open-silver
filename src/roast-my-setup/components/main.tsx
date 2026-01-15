"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type {
  AnalyzeSetupRequest,
  AnalyzeSetupResponse,
  CameraRef,
  CameraStatus,
} from "../types";
import { Camera } from "./camera";

export function RoastMySetup() {
  const cameraRef = useRef<CameraRef>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");

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
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row gap-6">
        <Camera
          className="w-2/3 mx-auto"
          ref={cameraRef}
          status={cameraStatus}
          onStatusChange={setCameraStatus}
        />
        {cameraStatus === "active" && (
          <Card className="w-1/3">
            <CardContent className="flex flex-col gap-4">
              <p className="text-2xl bg-muted p-2 rounded-xl rounded-tl-none text-nowrap w-min">
                Hey! Say &quot;
                <button
                  onClick={() => mutate()}
                  disabled={isPending}
                  className="link cursor-pointer"
                >
                  Roast me
                </button>
                &quot; aloud.
              </p>
              {isPending && (
                <p className="text-2xl bg-muted p-2 rounded-xl rounded-tr-none text-end w-min text-nowrap ms-auto">
                  Roast me
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
