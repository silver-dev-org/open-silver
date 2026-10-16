import { SYSTEM_PROMPT, SYSTEM_PROMPT_UNHINGED } from "@/roast-me/constants";
import { setupAnalysisSchema } from "@/roast-me/schemas";
import { SetupAnalysisRequest } from "@/roast-me/types";
import { GatewayError } from "@ai-sdk/gateway";
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
    model: "openai/gpt-5.4-nano",
    schema: setupAnalysisSchema,
    providerOptions: {
      openai: {
        reasoningEffort: "low",
        structuredOutputs: true,
        strictJsonSchema: true,
      },
    },
    system: isUnhinged ? SYSTEM_PROMPT_UNHINGED : SYSTEM_PROMPT,
    messages: [{ role: "user", content: [{ type: "image", image: snapshot }] }],
    onError: ({ error }) => {
      if (GatewayError.isInstance(error) && error.statusCode === 402)
        console.warn("[roast-me/analyze] stream failed", error);
      else console.error("[roast-me/analyze] stream failed", error);
    },
  });

  return result.toTextStreamResponse();
}
