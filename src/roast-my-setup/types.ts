export type CameraStatus = "idle" | "requesting" | "active" | "frozen" | "error";

export type CameraRef = {
  captureSnapshot: () => string | null;
};

export type SetupScore = "Pass" | "Fail";

export type AnalyzeSetupRequest = {
  snapshot: string;
};

export type AnalyzeSetupResponse = {
  score: SetupScore;
  greenFlags: string[];
  yellowFlags: string[];
  redFlags: string[];
};
