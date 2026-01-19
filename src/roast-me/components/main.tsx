"use client";

import { XCorp } from "@/components/logos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { SHARE_URL } from "../constants";
import { setupAnalysisSchema } from "../schemas";
import { CameraRef, CameraStatus, SetupAnalysisRequest } from "../types";
import { Camera } from "./camera";
import { MessageChat } from "./message-chat";
import { usePathname } from "next/dist/client/components/navigation";

export function RoastMe() {
  const pathname = usePathname();
  const cameraRef = useRef<CameraRef>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const isUnleashed = pathname?.endsWith("unleashed");

  const { object, submit, isLoading } = useObject({
    api: "/roast-me/api/analyze",
    schema: setupAnalysisSchema,
  });

  function tryAgain() {
    setCameraStatus("active");
    setSnapshot(null);
  }

  function analyzeSetup() {
    const capturedSnapshot = cameraRef.current?.captureSnapshot();
    if (!capturedSnapshot) {
      throw new Error("Failed to capture snapshot");
    }

    const input: SetupAnalysisRequest = {
      snapshot: capturedSnapshot,
      isUnleashed,
    };

    setSnapshot(capturedSnapshot);
    setCameraStatus("frozen");
    submit(input);
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
        <Card className="md:w-1/3 h-[720px] max-h-[75vh] gap-0 pt-0">
          <CardContent className="flex flex-col gap-6 h-full overflow-y-scroll">
            <div />
            <MessageChat
              isLoading={isLoading}
              isUnleashed={isUnleashed}
              cameraStatus={cameraStatus}
              data={object}
              onRoast={analyzeSetup}
            />
            <div />
          </CardContent>
          {cameraStatus === "frozen" && (
            <CardFooter className="flex gap-6 border-t">
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
