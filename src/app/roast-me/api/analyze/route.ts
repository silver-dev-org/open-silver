import { SYSTEM_PROMPT, SYSTEM_PROMPT_UNHINGED } from "@/roast-me/constants";
import { setupAnalysisSchema } from "@/roast-me/schemas";
import { SetupAnalysisRequest } from "@/roast-me/types";
import { streamObject } from "ai";
import { NextRequest } from "next/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { createRouteLog, describeError } from "@/lib/route-log";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const log = createRouteLog("/roast-me/api/analyze");
  const { snapshot, isUnhinged }: SetupAnalysisRequest = await req.json();

  log.set({ mode: isUnhinged ? "unhinged" : "standard" });
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
    onFinish: ({ usage, error }) =>
      error
        ? log.error("invalid_object", { usage, error: describeError(error) })
        : log.info("analyzed", { usage }),
    onError: ({ error }) => {
      if (!log.gatewayUnavailable(error)) log.unexpected(error);
    },
  });

  return result.toTextStreamResponse();
}
