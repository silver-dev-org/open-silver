import { z } from "zod";

export const setupAnalysisSchema = z.object({
  score: z.enum(["pass", "fail"]),
  flags: z.object({
    green: z.array(z.string()),
    yellow: z.array(z.string()),
    red: z.array(z.string()),
  }),
  actionPlanSteps: z.array(z.string()),
});
