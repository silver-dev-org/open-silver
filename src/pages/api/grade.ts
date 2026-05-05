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

function isValidGetUrl(url: NextApiRequest["query"]["url"]): url is string {
  return typeof url === "string";
}

function sendJsonError(res: NextApiResponse, status: number, error: string) {
  return res.status(status).json({ error });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>,
) {
  if (!req.method || !["POST", "GET"].includes(req.method)) {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (req.method === "GET" && !isValidGetUrl(req.query.url)) {
    res.status(400).json({ error: "MissingURL" });
    return;
  }

  if (req.method === "POST" && !isMultipartFormData(req)) {
    res.status(400).json({ error: "InvalidUploadRequest" });
    return;
  }

  try {
    let pdfBuffer: Buffer;
    if (req.method === "GET") {
      const url = req.query.url;
      if (!isValidGetUrl(url)) {
        throw new Error("MissingURL");
      }

      const exampleResponse = exampleResponses.get(url);
      if (exampleResponse) {
        res.status(200).json(exampleResponse);
        return;
      }

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } else if (isMultipartFormData(req)) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      pdfBuffer = Buffer.concat(chunks);
    } else {
      throw new Error("InvalidUploadRequest");
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
      throw new Error("GradingError");
    }

    const sanitized = sanitizeCompletion(completion);

    res.status(200).json(sanitized);
  } catch (e) {
    if (!(e instanceof Error)) {
      console.error(e);
      sendJsonError(res, 500, "UnknownError");
      return;
    }

    if (
      e.message.includes("InvalidPDFException") ||
      e.message.includes("Invalid PDF structure")
    ) {
      console.warn(e);
      sendJsonError(res, 400, "InvalidPDFException");
      return;
    }

    console.error(e);
    sendJsonError(res, 500, e.message);
  }
}

export const config = {
  maxDuration: 300,
  api: {
    bodyParser: false,
  },
};
