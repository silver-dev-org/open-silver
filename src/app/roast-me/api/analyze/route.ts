import { SYSTEM_PROMPT, SYSTEM_PROMPT_UNHINGED } from "@/roast-me/constants";
import { setupAnalysisSchema } from "@/roast-me/schemas";
import { SetupAnalysisRequest } from "@/roast-me/types";
import { xai } from "@ai-sdk/xai";
import { streamObject } from "ai";
import { NextRequest } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { snapshot, isUnhinged } = (await req.json()) as SetupAnalysisRequest;

  const result = streamObject({
    model: xai("grok-4-1-fast-non-reasoning"),
    schema: setupAnalysisSchema,
    temperature: 0,
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
