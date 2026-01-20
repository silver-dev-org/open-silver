import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Score } from "../types";
import { StaticGtaOverlay } from "./gta-overlay";

interface SnapshotDisplayProps {
  snapshotUrl: string;
  score: Score;
  className?: string;
}

export function SnapshotDisplay({
  snapshotUrl,
  score,
  className,
}: SnapshotDisplayProps) {
  return (
    <Card
      className={cn(
        "aspect-video overflow-hidden p-0 border-4 border-primary",
        className
      )}
    >
      <div className="relative w-full h-full">
        {/* Vignette */}
        <div className="pointer-events-none absolute inset-0 z-[5] shadow-vignette" />

        {/* Rectangular Corners */}
        <div className="absolute left-4 top-4 h-4 w-4 border-l-2 border-t-2 border-white z-[5]" />
        <div className="absolute right-4 top-4 h-4 w-4 border-r-2 border-t-2 border-white z-[5]" />
        <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-white z-[5]" />
        <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-white z-[5]" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={snapshotUrl}
          alt="Roast snapshot"
          className={cn(
            "w-full h-full object-cover",
            score === "fail" && "grayscale"
          )}
        />
        <StaticGtaOverlay score={score} />
      </div>
    </Card>
  );
}
