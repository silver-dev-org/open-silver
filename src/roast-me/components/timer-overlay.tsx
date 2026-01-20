"use client";

import { useEffect, useState } from "react";

type TimerOverlayProps = {
  isRunning: boolean;
};

function formatTime(timeInSeconds: number) {
  const minutes = Math.floor(timeInSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function TimerOverlay({ isRunning }: TimerOverlayProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-black/50 px-2 py-1 text-xs font-semibold text-white">
      {formatTime(elapsedTime)}
    </div>
  );
}
