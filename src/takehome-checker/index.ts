import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { prompt } from "./constants";
import { TakeHome, TakeHomeAnalysis } from "./types";
import { takeHomeToXML } from "./utils";
import { extractJsonFromString } from "@/lib/utils";

export type AnalyzeTakeHomeOptions = {
  codeTruncation?: number;
};

export async function analyzeTakeHome(
  takeHome: TakeHome,
  options?: AnalyzeTakeHomeOptions,
): Promise<TakeHomeAnalysis> {
  const content = takeHomeToXML(takeHome, options?.codeTruncation);

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      { role: "system", content: prompt },
      { role: "user", content },
    ],
    maxOutputTokens: 10000,
    temperature: 0.2,
  });

  return extractJsonFromString(text) as TakeHomeAnalysis;
}
