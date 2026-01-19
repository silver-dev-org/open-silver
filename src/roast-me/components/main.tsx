"use client";

import { XCorp } from "@/components/logos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { RefreshCcw, Volume2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SHARE_URL } from "../constants";
import { setupAnalysisSchema } from "../schemas";
import { CameraRef, CameraStatus, SetupAnalysisRequest } from "../types";
import { Camera } from "./camera";
import { GtaOverlay } from "./gta-overlay";
import { MessageChat } from "./message-chat";
import { usePathname } from "next/dist/client/components/navigation";

export function RoastMe() {
  const pathname = usePathname();
  const cameraRef = useRef<CameraRef>(null);
  const [volumeAcknowledged, setVolumeAcknowledged] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [showGtaAnimation, setShowGtaAnimation] = useState(false);
  const [gtaAnimationComplete, setGtaAnimationComplete] = useState(false);
  const isUnleashed = pathname?.endsWith("unleashed");

  const { object, submit, isLoading } = useObject({
    api: "/roast-me/api/analyze",
    schema: setupAnalysisSchema,
  });

  useEffect(() => {
    if (object?.score && !showGtaAnimation && !gtaAnimationComplete) {
      setShowGtaAnimation(true);
    }
  }, [object?.score, showGtaAnimation, gtaAnimationComplete]);

  const handleGtaAnimationComplete = useCallback(() => {
    setShowGtaAnimation(false);
    setGtaAnimationComplete(true);
  }, []);

  function tryAgain() {
    setCameraStatus("active");
    setSnapshot(null);
    setShowGtaAnimation(false);
    setGtaAnimationComplete(false);
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

  if (!volumeAcknowledged) {
    return (
      <Card
        className="aspect-video md:w-2/3 mx-auto border-4 border-dotted"
        hoverable
        onClick={() => setVolumeAcknowledged(true)}
      >
        <CardContent className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <Volume2 className="size-12" />
          <p className="text-center">Turn your volume up for the best experience</p>
          <p className="text-center text-sm">Click to continue</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Camera
        className="md:w-2/3 mx-auto"
        ref={cameraRef}
        status={cameraStatus}
        onStatusChange={setCameraStatus}
        snapshot={snapshot}
        grayscale={object?.score === "fail"}
        overlay={
          object?.score ? (
            <GtaOverlay
              score={object.score}
              onAnimationComplete={handleGtaAnimationComplete}
            />
          ) : null
        }
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
              showResults={gtaAnimationComplete}
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
