"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect } from "react";

interface MessageBoxProps {
  children: ReactNode;
  side: "left" | "right";
  className?: string;
}

export function MessageBox({ children, side, className }: MessageBoxProps) {
  useEffect(() => {
    const audio = new Audio("/sfx/message.mp3");
    audio.play().catch(() => {});
  }, []);

  return (
    <div
      className={cn(
        "relative text-lg bg-muted px-4 py-2 rounded-2xl max-w-[85%] shadow-sm animate-message-bubble",
        side === "left"
          ? "rounded-tl-none text-start me-auto"
          : "rounded-tr-none text-end ms-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
