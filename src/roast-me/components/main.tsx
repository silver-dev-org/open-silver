"use client";

import { XCorp } from "@/components/logos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import { getShareUrl } from "../constants";
import { setupAnalysisSchema } from "../schemas";
import {
  CameraRef,
  CameraStatus,
  SetupAnalysis,
  SetupAnalysisRequest,
  ShareRequest,
  ShareResponse,
} from "../types";
import { Camera } from "./camera";
import { FeedbackDialog } from "./feedback-dialog";
import { GtaOverlay } from "./gta-overlay";
import { MessageChat } from "./message-chat";
import { usePathname } from "next/dist/client/components/navigation";
import { useRealtimeTranscription } from "../hooks/use-realtime-transcription";

export function RoastMe() {
  const pathname = usePathname();
  const cameraRef = useRef<CameraRef>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [showGtaAnimation, setShowGtaAnimation] = useState(false);
  const [gtaAnimationComplete, setGtaAnimationComplete] = useState(false);
  const [gtaTextShown, setGtaTextShown] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isUnhinged = pathname?.endsWith("unhinged");

  const { object, submit } = useObject({
    api: "/roast-me/api/analyze",
    schema: setupAnalysisSchema,
    onError: (error) => {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze setup", {
        description: "Please try again or check your connection.",
      });
      setCameraStatus("active");
      setSnapshot(null);
    },
  });

  const [analysisResult, setAnalysisResult] =
    useState<typeof object>(undefined);

  useEffect(() => {
    if (object) {
      setAnalysisResult(object);
    }
  }, [object]);

  useEffect(() => {
    if (analysisResult?.score && !showGtaAnimation && !gtaAnimationComplete) {
      setShowGtaAnimation(true);
    }
  }, [analysisResult?.score, showGtaAnimation, gtaAnimationComplete]);

  const handleGtaAnimationComplete = useCallback(() => {
    setShowGtaAnimation(false);
    setGtaAnimationComplete(true);
  }, []);

  const handleGtaTextShow = useCallback(() => {
    setGtaTextShown(true);
  }, []);

  const tryAgain = useCallback(() => {
    setCameraStatus("active");
    setSnapshot(null);
    setShowGtaAnimation(false);
    setGtaAnimationComplete(false);
    setGtaTextShown(false);
    setAnalysisResult(undefined);
  }, []);

  const isAnalysisComplete = (
    data: typeof analysisResult,
  ): data is SetupAnalysis => {
    return !!(
      data?.score &&
      data?.flags?.green &&
      data?.flags?.yellow &&
      data?.flags?.red &&
      data?.actionPlanSteps
    );
  };

  const share = useCallback(async () => {
    if (!snapshot || !isAnalysisComplete(analysisResult)) return;

    setIsSharing(true);
    try {
      const response = await fetch("/roast-me/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot,
          analysis: analysisResult,
          isUnhinged: !!isUnhinged,
        } satisfies ShareRequest),
      });

      if (!response.ok) {
        throw new Error("Failed to save roast");
      }

      const { id } = (await response.json()) as ShareResponse;
      const shareUrl = getShareUrl(id, analysisResult.score, !!isUnhinged);
      window.open(shareUrl, "_blank");
    } catch (error) {
      console.error("Error sharing roast:", error);
      toast.error("Failed to share", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setIsSharing(false);
    }
  }, [snapshot, analysisResult, isUnhinged]);

  const analyzeSetup = useCallback(() => {
    try {
      const capturedSnapshot = cameraRef.current?.captureSnapshot();
      if (!capturedSnapshot) {
        toast.error("Failed to capture snapshot", {
          description: "Please make sure your camera is working properly.",
        });
        return;
      }

      const input: SetupAnalysisRequest = {
        snapshot: capturedSnapshot,
        isUnhinged,
      };

      setSnapshot(capturedSnapshot);
      setCameraStatus("frozen");
      submit(input);
    } catch (error) {
      console.error("Error analyzing setup:", error);
      toast.error("Failed to start analysis", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  }, [cameraRef, isUnhinged, submit]);

  const {
    status: transcriptionStatus,
    isListening,
    toggleListening,
  } = useRealtimeTranscription({
    onTriggerPhrase: (transcript) => {
      console.log("Trigger phrase detected:", transcript);
      if (cameraStatus === "active") {
        analyzeSetup();
      }
    },
    triggerPhrases: ["roast me"],
    enabled: cameraStatus === "active",
  });

  useEffect(() => {
    if (!isListening || cameraStatus !== "active") return;

    const timer = setTimeout(() => {
      toggleListening();
    }, 30000);

    return () => clearTimeout(timer);
  }, [isListening, cameraStatus, toggleListening]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Camera
        className="md:w-2/3 mx-auto"
        ref={cameraRef}
        status={cameraStatus}
        onStatusChange={setCameraStatus}
        snapshot={snapshot}
        grayscale={analysisResult?.score === "fail"}
        transcriptionStatus={transcriptionStatus}
        isListening={isListening}
        onToggleListening={toggleListening}
        overlay={
          analysisResult?.score ? (
            <GtaOverlay
              score={analysisResult.score}
              onAnimationComplete={handleGtaAnimationComplete}
              onTextShow={handleGtaTextShow}
            />
          ) : null
        }
      />
      <Card className="md:w-1/3 h-[720px] max-h-[75vh] gap-0 pt-0">
        <CardContent className="flex flex-col gap-6 h-full overflow-y-scroll">
          <div />
          <MessageChat
            isUnhinged={isUnhinged}
            cameraStatus={cameraStatus}
            data={analysisResult}
            onRoast={analyzeSetup}
            showResults={gtaTextShown}
          />
          <div />
        </CardContent>
        {analysisResult && cameraStatus === "frozen" && (
          <CardFooter className="flex flex-col gap-6 border-t">
            <div className="flex gap-6 w-full">
              <Button variant="default" className="flex-1" onClick={tryAgain}>
                <RefreshCcw />
                Try Again
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={share}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <XCorp className="fill-secondary-foreground" />
                )}
                {isSharing ? "Sharing..." : "Share"}
              </Button>
            </div>
            {snapshot && isAnalysisComplete(analysisResult) && (
              <FeedbackDialog
                snapshot={snapshot}
                analysis={analysisResult}
                isUnhinged={!!isUnhinged}
              />
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
