import {
  exampleResponses,
  messages,
  ResponseData,
  ResponseSchema,
  sanitizeCompletion,
} from "@/resume-checker/prompts/grade";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";
import pdf from "pdf-parse";

function isMultipartFormData(req: NextApiRequest) {
  return (
    req.method === "POST" &&
    req.headers["content-type"]?.includes("multipart/form-data")
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>,
) {
  try {
    if (!["POST", "GET"].includes(req.method || "")) {
      res.status(404).send({ error: "Not Found" });
      return;
    }

    let pdfBuffer: Buffer;
    if (isMultipartFormData(req)) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      pdfBuffer = Buffer.concat(chunks);
    } else {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        throw new Error("Tenés que proveer un archivo PDF o un URL.");
      }

      const exampleResponse = exampleResponses.get(url);
      if (exampleResponse) {
        res.status(200).json(exampleResponse);
        return;
      }

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    const parsed = await pdf(pdfBuffer);

    const completion = await generateObject({
      model: google("gemini-2.5-flash"),
      temperature: 0,
      messages: messages(parsed, pdfBuffer),
      schema: ResponseSchema,
      mode: "json",
    });

    if (!completion) {
      throw new Error(
        "No se pudo completar el proceso de evaluación de currículum.",
      );
    }

    const sanitized = sanitizeCompletion(completion);

    res.status(200).json(sanitized);
  } catch (e) {
    if (!(e instanceof Error)) {
      console.error(e);
      res.status(500).send({
        error: "Ocurrió un error inesperado.",
      });
      return;
    }

    if (
      e.message.includes("InvalidPDFException") ||
      e.message.includes("Invalid PDF structure")
    ) {
      console.warn(e);
      res.status(400).send({
        error: "El archivo PDF proporcionado no es válido.",
      });
      return;
    }

    console.error(e);
    res.status(500).send({
      error: e.message,
    });
  }
}

export const config = {
  maxDuration: 300,
  api: {
    bodyParser: false,
  },
};
