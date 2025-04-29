import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";
import { createPrompt } from "@/company-checker/utils/prompts";

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
