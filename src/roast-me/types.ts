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
  snapshotUrl: string;
  analysis: SetupAnalysis;
  isUnhinged: boolean;
  createdAt: string;
};

export type ShareRequest = {
  snapshot: string;
  analysis: SetupAnalysis;
  isUnhinged: boolean;
};

export type ShareResponse = {
  id: string;
};
