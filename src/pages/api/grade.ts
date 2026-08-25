import {
  exampleResponses,
  messages,
  ResponseData,
  ResponseSchema,
  sanitizeCompletion,
} from "@/resume-checker/prompts/grade";
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
  // Bad requests are answered before the try block so they stay 4xx: crawlers
  // submit the resume-checker form as a GET and used to log a 500 per hit.
  if (!["POST", "GET"].includes(req.method || "")) {
    res.status(405).json({ error: "MethodNotAllowed" });
    return;
  }

  const { url } = req.query;
  const resumeUrl = typeof url === "string" ? url.trim() : "";
  if (req.method === "GET" && !resumeUrl) {
    res.status(400).json({ error: "MissingURL" });
    return;
  }

  if (req.method === "POST" && !isMultipartFormData(req)) {
    res.status(400).json({ error: "InvalidUploadRequest" });
    return;
  }

  try {
    let pdfBuffer: Buffer;
    if (isMultipartFormData(req)) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      pdfBuffer = Buffer.concat(chunks);
    } else {
      const exampleResponse = exampleResponses.get(resumeUrl);
      if (exampleResponse) {
        res.status(200).json(exampleResponse);
        return;
      }

      const response = await fetch(resumeUrl);
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    const parsed = await pdf(pdfBuffer);

    const completion = await generateObject({
      model: "google/gemini-2.5-flash",
      temperature: 0,
      messages: messages(parsed, pdfBuffer),
      schema: ResponseSchema,
    });

    if (!completion) {
      throw new Error("GradingError");
    }

    const sanitized = sanitizeCompletion(completion);

    res.status(200).json(sanitized);
  } catch (e) {
    if (!(e instanceof Error)) {
      console.error(e);
      res.status(500).json({
        error: "UnknownError",
      });
      return;
    }

    if (
      e.message.includes("InvalidPDFException") ||
      e.message.includes("Invalid PDF structure")
    ) {
      console.warn(e);
      res.status(400).json({
        error: "InvalidPDFException",
      });
      return;
    }

    // The client renders this string straight into a badge, so it must stay a
    // stable code rather than whatever the PDF parser or the model threw.
    console.error(e);
    res.status(500).json({
      error: "GradingError",
    });
  }
}

export const config = {
  maxDuration: 300,
  api: {
    bodyParser: false,
  },
};
