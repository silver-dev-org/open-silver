import {
  messages,
  ResponseData,
  ResponseSchema,
  sanitizeCompletion,
} from "@/resume-checker/prompts/grade";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "node:fs";
import path from "node:path";
import pdf from "pdf-parse";

function isMultipartFormData(req: NextApiRequest) {
  return (
    req.method === "POST" &&
    req.headers["content-type"]?.includes("multipart/form-data")
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
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

      if (url.startsWith("public")) {
        pdfBuffer = fs.readFileSync(path.join(process.cwd(), url));
        /* Set cache for a week only on the template resumes */
        res.setHeader("Content-Location", url);
        res.setHeader(
          "Cache-Control",
          "public, max-age=604800, stale-while-revalidate=604800"
        );
      } else {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      }
    }

    const parsed = await pdf(pdfBuffer);

    const completion = await generateObject({
      model: google("gemini-1.5-pro"),
      temperature: 0,
      messages: messages(parsed, pdfBuffer),
      schema: ResponseSchema,
    });

    if (!completion) {
      throw new Error(
        "No se pudo completar el proceso de evaluación de currículum."
      );
    }

    const sanitized = sanitizeCompletion(completion);

    res.status(200).json(sanitized);
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
