import { SYSTEM_PROMPT, SYSTEM_PROMPT_UNHINGED } from "@/roast-me/constants";
import { setupAnalysisSchema } from "@/roast-me/schemas";
import { SetupAnalysisRequest } from "@/roast-me/types";
import { xai } from "@ai-sdk/xai";
import { streamObject } from "ai";
import { NextRequest } from "next/server";
import { getPostHogClient } from "@/lib/posthog-server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { snapshot, isUnhinged }: SetupAnalysisRequest = await req.json();

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: "anonymous",
    event: "roast_me_api_analysis_requested",
    properties: {
      mode: isUnhinged ? "unhinged" : "standard",
    },
  });

  const result = streamObject({
    model: xai("grok-4-1-fast-non-reasoning"),
    schema: setupAnalysisSchema,
    temperature: isUnhinged ? 0.2 : 0,
    messages: [
      {
        role: "system",
        content: isUnhinged ? SYSTEM_PROMPT_UNHINGED : SYSTEM_PROMPT,
      },
      { role: "user", content: [{ type: "image", image: snapshot }] },
    ],
  });

  return result.toTextStreamResponse();
}
