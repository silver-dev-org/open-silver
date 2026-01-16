import type { CameraStatus } from "./types";

export const METADATA = {
  title: "Roast my Setup",
  description:
    "How do other people see you? Get honest feedback from your setup.",
};

export const BORDER_BY_STATUS: Record<CameraStatus, string> = {
  idle: "border-dotted",
  error: "border-destructive",
  requesting: "border-dashed animate-pulse",
  active: "border-accent",
  frozen: "border-primary",
};
