import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";

const createPrompt = (company: string) => `
  I'm preparing for a job interview with ${company}. I need a full, detailed research summary to be well-prepared.

  Please provide the following information organized by sections, and format the response in real raw Markdown (#, ##, -, etc.) so it’s easy to read and structured.

  Sections to include:

  Company Overview:
  - What does the company do in simple terms?
  - What is their main product or service?
  - How does the product or service work? (high-level and, if possible, some technical detail)

  Industry Context:
  - In which industry does the company operate?
  - Briefly describe current trends, challenges, and opportunities in this industry.
  - Company History and Status:

  When was the company founded?
  - Who are the founders and what is their background?
  - How big is the company today (number of employees, main offices)?

  Funding and Growth:
  - Has the company raised any funding?
  - What funding rounds have they completed (Seed, Series A, B, etc.)?
  - Who are their main investors?

  Business Model:
  - How does the company make money?
  - What is their go-to-market strategy (if available)?

  Competitive Landscape:
  - Who are the main competitors?
  - What is the company's competitive advantage?

  Recent News and Developments:
  - Major updates in the past 6–12 months (product launches, partnerships, expansions, controversies, etc.).

  Technical Architecture / Core Technology (optional if applicable):
  - If the main product involves APIs, AI, SaaS, or technical systems, explain briefly the high-level technical architecture or core technologies they use.

  If any information is not available publicly, just note it briefly.

  IMPORTANT!!!!:
  1) the response should be in real raw Markdown (#, ##, -, etc.) as if you were writing a .md file.
  2) dont add any introductary or ending explanations or talkative information.
  3) this is not a placeholder you should fill with actual information. If you don't have any information to share, just note it briefly.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ text: string } | { error: string }>,
) {
  try {
    if (!["GET"].includes(req.method || "")) {
      res.status(404).send({ error: "Not Found" });
      return;
    }

    const { company } = req.query;
    if (!company || typeof company !== "string") {
      throw new Error("Tenés que compartir el nombre de una empresa.");
    }

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system: "You are a helpful assistant.",
      prompt: createPrompt(company),
    });

    if (!text) {
      throw new Error(
        "No se pudo completar el proceso de investigación de empresa.",
      );
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error:
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
    });
  }
}

export const config = {
  maxDuration: 300,
  api: {
    bodyParser: false,
  },
};
