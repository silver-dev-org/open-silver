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
import { MessageBox } from "./message-box";

export function RoastMySetup() {
  const cameraRef = useRef<CameraRef>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const { mutate, isPending, data } = useMutation({
    mutationFn: async () => {
      const capturedSnapshot = cameraRef.current?.captureSnapshot();
      if (!capturedSnapshot) {
        throw new Error("Failed to capture snapshot");
      }

      setSnapshot(capturedSnapshot);
      setCameraStatus("frozen");

      const body: AnalyzeSetupRequest = { snapshot: capturedSnapshot };
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
          snapshot={snapshot}
        />
        {(cameraStatus === "active" || cameraStatus === "frozen") && (
          <Card className="w-1/3">
            <CardContent className="flex flex-col gap-4 overflow-auto">
              {(cameraStatus === "active" || cameraStatus === "frozen") && (
                <MessageBox side="left">
                  Hey! Say &quot;
                  <button
                    onClick={() => mutate()}
                    disabled={cameraStatus === "frozen"}
                    className="link cursor-pointer"
                  >
                    Roast me
                  </button>
                  &quot; aloud.
                </MessageBox>
              )}
              {cameraStatus === "frozen" && (
                <>
                  <MessageBox side="right">Roast me</MessageBox>
                  {isPending && (
                    <MessageBox side="left">
                      <span className="inline-flex">
                        <span
                          className="animate-bounce"
                          style={{ animationDelay: "0s" }}
                        >
                          .
                        </span>
                        <span
                          className="animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        >
                          .
                        </span>
                        <span
                          className="animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        >
                          .
                        </span>
                      </span>
                    </MessageBox>
                  )}
                  {data && (
                    <MessageBox side="left">
                      <p className="text-2xl font-bold">{data.score}</p>
                      {data.greenFlags.length > 0 && (
                        <ul className="text-success">
                          {data.greenFlags.map((flag, i) => (
                            <li key={i}>+ {flag}</li>
                          ))}
                        </ul>
                      )}
                      {data.yellowFlags.length > 0 && (
                        <ul className="text-warning">
                          {data.yellowFlags.map((flag, i) => (
                            <li key={i}>~ {flag}</li>
                          ))}
                        </ul>
                      )}
                      {data.redFlags.length > 0 && (
                        <ul className="text-destructive">
                          {data.redFlags.map((flag, i) => (
                            <li key={i}>- {flag}</li>
                          ))}
                        </ul>
                      )}
                    </MessageBox>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
