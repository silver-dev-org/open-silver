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
import { PreppingData } from "../utils";
import { Camera } from "./camera";
import { FeedbackDialog } from "./feedback-dialog";
import { GtaOverlay } from "./gta-overlay";
import { MessageChat } from "./message-chat";
import { usePathname } from "next/dist/client/components/navigation";
import { useRealtimeTranscription } from "../hooks/use-realtime-transcription";
import posthog from "posthog-js";

export function RoastMe() {
  const pathname = usePathname();
  const cameraRef = useRef<CameraRef>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [showGtaAnimation, setShowGtaAnimation] = useState(false);
  const [gtaAnimationComplete, setGtaAnimationComplete] = useState(false);
  const [gtaTextShown, setGtaTextShown] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [triggerMethod, setTriggerMethod] = useState<"voice" | "button" | null>(
    null,
  );
  const [captureStartTime, setCaptureStartTime] = useState<number | null>(null);
  const [mispronunciationState, setMispronunciationState] = useState<
    Array<{
      detectedPhrase: string;
      attemptNumber: number;
    }>
  >([]);
  const [showMutedWarning, setShowMutedWarning] = useState(false);
  const hasTrackedCompletion = useRef(false);
  const isUnhinged = pathname?.endsWith("unhinged");

  const { object, submit } = useObject({
    api: "/roast-me/api/analyze",
    schema: setupAnalysisSchema,
    onError: (error) => {
      console.error("Analysis error:", error);
      posthog.capture("roast_me_analysis_error", {
        mode: isUnhinged ? "unhinged" : "standard",
        error_message: error.message,
        trigger_method: triggerMethod || "unknown",
      });
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
    // Only sync object to analysisResult when camera is frozen (analyzing)
    if (object && cameraStatus === "frozen") {
      setAnalysisResult(object);

      // Track analysis completed when we have complete results (only once)
      if (
        !hasTrackedCompletion.current &&
        object.score &&
        object.flags?.green &&
        object.flags?.yellow &&
        object.flags?.red &&
        object.actionPlanSteps
      ) {
        hasTrackedCompletion.current = true;

        const durationMs = captureStartTime
          ? Date.now() - captureStartTime
          : undefined;

        posthog.capture("roast_me_analysis_completed", {
          mode: isUnhinged ? "unhinged" : "standard",
          score: object.score,
          trigger_method: triggerMethod || "unknown",
          green_flags_count: object.flags.green.length,
          yellow_flags_count: object.flags.yellow.length,
          red_flags_count: object.flags.red.length,
          duration_ms: durationMs,
        });

        PreppingData.setToolData("roast-me", object.score);
      }
    }
  }, [object, cameraStatus]);

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
    if (analysisResult) {
      posthog.capture("roast_me_try_again_clicked", {
        mode: isUnhinged ? "unhinged" : "standard",
        previous_score: analysisResult.score,
        previous_green_flags_count: analysisResult.flags?.green?.length || 0,
        previous_yellow_flags_count: analysisResult.flags?.yellow?.length || 0,
        previous_red_flags_count: analysisResult.flags?.red?.length || 0,
      });
    }

    setCameraStatus("active");
    setSnapshot(null);
    setShowGtaAnimation(false);
    setGtaAnimationComplete(false);
    setGtaTextShown(false);
    setAnalysisResult(undefined);
    setTriggerMethod(null);
    setCaptureStartTime(null);
    setMispronunciationState([]);
    hasTrackedCompletion.current = false;
  }, [analysisResult, isUnhinged]);

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

    posthog.capture("roast_me_share_initiated", {
      mode: isUnhinged ? "unhinged" : "standard",
      score: analysisResult.score,
      green_flags_count: analysisResult.flags.green.length,
      yellow_flags_count: analysisResult.flags.yellow.length,
      red_flags_count: analysisResult.flags.red.length,
    });

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

      posthog.capture("roast_me_share_completed", {
        mode: isUnhinged ? "unhinged" : "standard",
        score: analysisResult.score,
        roast_id: id,
        share_url: shareUrl,
        green_flags_count: analysisResult.flags.green.length,
        yellow_flags_count: analysisResult.flags.yellow.length,
        red_flags_count: analysisResult.flags.red.length,
      });

      // Wait for Vercel Blob Storage to propagate the files before redirecting
      await new Promise((resolve) => setTimeout(resolve, 2000));

      window.open(shareUrl, "_blank");
    } catch (error) {
      console.error("Error sharing roast:", error);

      posthog.capture("roast_me_share_failed", {
        mode: isUnhinged ? "unhinged" : "standard",
        score: analysisResult.score,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });

      toast.error("Failed to share", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setIsSharing(false);
    }
  }, [snapshot, analysisResult, isUnhinged]);

  const analyzeSetup = useCallback(
    (method?: "voice" | "button") => {
      try {
        const capturedSnapshot = cameraRef.current?.captureSnapshot();
        if (!capturedSnapshot) {
          toast.error("Failed to capture snapshot", {
            description: "Please make sure your camera is working properly.",
          });
          return;
        }

        // Set trigger method if provided
        if (method) {
          setTriggerMethod(method);
        }

        // Set capture start time for duration tracking
        setCaptureStartTime(Date.now());

        posthog.capture("roast_me_capture_triggered", {
          mode: isUnhinged ? "unhinged" : "standard",
          trigger_method: method || triggerMethod || "unknown",
        });

        posthog.capture("roast_me_snapshot_captured", {
          mode: isUnhinged ? "unhinged" : "standard",
          trigger_method: method || triggerMethod || "unknown",
        });

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
    },
    [cameraRef, isUnhinged, submit, triggerMethod],
  );

  const handleMispronunciation = useCallback(
    (transcript: string, detectedPhrase: string) => {
      setMispronunciationState((prev) => {
        const newAttemptNumber = prev.length + 1;

        posthog.capture("roast_me_mispronunciation_detected", {
          mode: isUnhinged ? "unhinged" : "standard",
          transcript,
          detected_phrase: detectedPhrase,
          attempt_count: newAttemptNumber,
        });

        return [
          ...prev,
          {
            detectedPhrase,
            attemptNumber: newAttemptNumber,
          },
        ];
      });
    },
    [isUnhinged],
  );

  const handleMutedSpeaking = useCallback(() => {
    setShowMutedWarning(true);
  }, []);

  const {
    status: transcriptionStatus,
    isListening,
    toggleListening,
  } = useRealtimeTranscription({
    onTriggerPhrase: (transcript) => {
      console.log("Trigger phrase detected:", transcript);
      if (cameraStatus === "active") {
        setTriggerMethod("voice");
        setMispronunciationState([]); // Clear mispronunciation on success
        analyzeSetup("voice");
      }
    },
    onMispronunciation: handleMispronunciation,
    triggerPhrases: ["roast me"],
    enabled: cameraStatus === "active",
    mode: isUnhinged ? "unhinged" : "standard",
  });

  useEffect(() => {
    if (!isListening || cameraStatus !== "active") return;

    const timer = setTimeout(() => {
      toggleListening();
    }, 30000);

    return () => clearTimeout(timer);
  }, [isListening, cameraStatus, toggleListening]);

  // Clear muted warning when user unmutes
  useEffect(() => {
    if (isListening) {
      setShowMutedWarning(false);
    }
  }, [isListening]);

  // Handle paste event for clipboard images
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (cameraStatus !== "active") return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
              setTriggerMethod("button");
              setCaptureStartTime(Date.now());

              posthog.capture("roast_me_capture_triggered", {
                mode: isUnhinged ? "unhinged" : "standard",
                trigger_method: "paste",
              });

              posthog.capture("roast_me_snapshot_captured", {
                mode: isUnhinged ? "unhinged" : "standard",
                trigger_method: "paste",
              });

              const input: SetupAnalysisRequest = {
                snapshot: dataUrl,
                isUnhinged,
              };

              setSnapshot(dataUrl);
              setCameraStatus("frozen");
              submit(input);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [cameraStatus, isUnhinged, submit]);

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
        onMutedSpeaking={handleMutedSpeaking}
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
            onRoast={() => analyzeSetup("button")}
            showResults={gtaTextShown}
            mispronunciation={mispronunciationState}
            showMutedWarning={showMutedWarning}
            transcriptionStatus={transcriptionStatus}
          />
          <div />
        </CardContent>
        {snapshot && isAnalysisComplete(analysisResult) && (
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
            <FeedbackDialog
              snapshot={snapshot}
              analysis={analysisResult}
              isUnhinged={!!isUnhinged}
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
