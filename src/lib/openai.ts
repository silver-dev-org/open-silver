import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callLLM(
  prompt: string,
  {
    model = "gpt-4.1-nano",
    max_tokens = 1000,
  }: {
    model?: string;
    max_tokens?: number;
  } = {}
): Promise<string | null> {
  const response = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model,
    max_tokens,
  });
  return response.choices[0].message.content;
}
