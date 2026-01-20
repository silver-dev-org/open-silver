"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { Score } from "../types";

const TEXT_SHADOW_PASS =
  "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000";
const TEXT_SHADOW_FAIL =
  "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 40px rgba(255, 0, 0, 0.8)";

function GtaOverlayText({
  score,
  animated = false,
}: {
  score: Score;
  animated?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative z-10 font-gta text-center",
        animated && "animate-in zoom-in-80 fade-in duration-1000",
        score === "pass" ? "text-amber-400" : "text-red-600"
      )}
      style={{
        fontSize: "clamp(2rem, 10vw, 6rem)",
        textShadow: score === "pass" ? TEXT_SHADOW_PASS : TEXT_SHADOW_FAIL,
        lineHeight: 1.1,
      }}
    >
      {score === "pass" ? (
        <>
          MISSION PASSED
          <br />
          <span className="text-[0.6em] text-white">RESPECT+</span>
        </>
      ) : (
        "ROASTED"
      )}
    </div>
  );
}

interface GtaOverlayProps {
  score: Score;
  onAnimationComplete: () => void;
  onTextShow?: () => void;
}

export function GtaOverlay({
  score,
  onAnimationComplete,
  onTextShow,
}: GtaOverlayProps) {
  const [showText, setShowText] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const textDelay = score === "fail" ? 1500 : 500;

    const textTimer = setTimeout(() => {
      setShowText(true);
      onTextShow?.();

      const soundFile =
        score === "pass"
          ? "/sfx/gta-mission-passed.mp3"
          : "/sfx/gta-wasted.mp3";
      audioRef.current = new Audio(soundFile);
      audioRef.current.play().catch(() => {});
    }, textDelay);

    const completeTimer = setTimeout(
      () => {
        onAnimationComplete();
      },
      score === "pass" ? 4000 : 4500
    );

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [score, onAnimationComplete, onTextShow]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      {showText && score === "pass" && (
        <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-500" />
      )}
      {showText && <GtaOverlayText score={score} animated />}
    </div>
  );
}

export function StaticGtaOverlay({ score }: { score: Score }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      {score === "pass" && <div className="absolute inset-0 bg-black/30" />}
      <GtaOverlayText score={score} />
    </div>
  );
}
