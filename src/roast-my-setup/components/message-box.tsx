import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MessageBoxProps {
  children: ReactNode;
  side: "left" | "right";
  className?: string;
}

export function MessageBox({ children, side, className }: MessageBoxProps) {
  return (
    <div
      className={cn(
        "text-lg bg-muted p-2 rounded-xl",
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
