"use client";

import { cn } from "@/lib/utils";

export function AudioIndicator({
  level,
  isListening,
  className,
}: {
  level: number;
  isListening: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-colors",
          isListening ? "bg-destructive animate-pulse" : "bg-muted-foreground"
        )}
      />
      <div className="flex h-4 items-end gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const threshold = (i + 1) / 5;
          const isActive = isListening && level >= threshold;
          return (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-75",
                isActive ? "bg-primary" : "bg-muted"
              )}
              style={{ height: `${(i + 1) * 20}%` }}
            />
          );
        })}
      </div>
      <span className="text-sm text-muted-foreground">
        {isListening ? "Listening..." : "Not listening"}
      </span>
    </div>
  );
}
