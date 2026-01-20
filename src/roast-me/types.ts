import z from "zod";
import { setupAnalysisSchema } from "./schemas";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "frozen"
  | "error";

export type CameraRef = {
  captureSnapshot: () => string | null;
};

export type SetupAnalysisRequest = {
  snapshot: string;
  isUnhinged?: boolean;
};

export type SetupAnalysis = z.infer<typeof setupAnalysisSchema>;

export type Score = SetupAnalysis["score"];

export type FlagColor = keyof SetupAnalysis["flags"];

export type RoastMetadata = {
  score: Score;
  snapshotUrl: string;
  createdAt: string;
};

export type ShareRequest = {
  snapshot: string;
  score: Score;
};

export type ShareResponse = {
  id: string;
};
