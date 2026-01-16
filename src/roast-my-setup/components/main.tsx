"use client";

import { XCorp } from "@/components/logos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import type {
  AnalyzeSetupRequest,
  AnalyzeSetupResponse,
  CameraRef,
  CameraStatus,
} from "../types";
import { Camera } from "./camera";
import { MessageChat } from "./message-chat";
import { SHARE_URL } from "../constants";

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

  function tryAgain() {
    setCameraStatus("active");
    setSnapshot(null);
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Camera
        className="md:w-2/3 mx-auto"
        ref={cameraRef}
        status={cameraStatus}
        onStatusChange={setCameraStatus}
        snapshot={snapshot}
      />
      {(cameraStatus === "active" || cameraStatus === "frozen") && (
        <Card className="md:w-1/3 h-[720px] gap-0">
          <CardContent className="flex flex-col gap-4 h-full overflow-auto">
            <MessageChat
              isPending={isPending}
              cameraStatus={cameraStatus}
              data={data}
              onRoast={mutate}
            />
          </CardContent>
          {cameraStatus === "frozen" && (
            <CardFooter className="flex gap-3 border-t">
              <Button variant="outline" className="flex-1" onClick={tryAgain}>
                <RefreshCcw />
                Try Again
              </Button>
              <Button variant="secondary" className="flex-1" asChild>
                <Link href={SHARE_URL} target="_blank">
                  <XCorp className="fill-secondary-foreground" />
                  Share
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
