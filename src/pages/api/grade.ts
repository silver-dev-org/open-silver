import {
  GRADING_MAX_OUTPUT_TOKENS,
  GRADING_THINKING_BUDGET,
  GRADING_TIMEOUT_MS,
} from "@/resume-checker/constants";
import {
  fetchRemoteResume,
  MAX_RESUME_BYTES,
  ResumeFetchError,
} from "@/resume-checker/fetch-resume";
import {
  InvalidResumePdfError,
  parseResume,
} from "@/resume-checker/parse-resume";
import {
  exampleResponses,
  getSysPrompt,
  messages,
  ResponseData,
  ResponseSchema,
  sanitizeCompletion,
} from "@/resume-checker/prompts/grade";
import { GatewayError } from "@ai-sdk/gateway";
import { generateObject, NoObjectGeneratedError } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";

function isMultipartFormData(req: NextApiRequest) {
  return (
    req.method === "POST" &&
    req.headers["content-type"]?.includes("multipart/form-data")
  );
}

function isGatewayUnavailable(statusCode: number) {
  return statusCode === 402 || statusCode === 429 || statusCode >= 500;
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

  const gradingSignal = AbortSignal.timeout(GRADING_TIMEOUT_MS);

  try {
    let pdfBuffer: Buffer;
    if (isMultipartFormData(req)) {
      // bodyParser is off, so nothing else bounds this stream: without the
      // running total a single request could buffer the whole heap away.
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_RESUME_BYTES) {
          req.destroy();
          res.status(413).json({ error: "ResumeTooLarge" });
          return;
        }
        chunks.push(chunk);
      }
      pdfBuffer = Buffer.concat(chunks);
    } else {
      const exampleResponse = exampleResponses.get(resumeUrl);
      if (exampleResponse) {
        res.status(200).json(exampleResponse);
        return;
      }

      pdfBuffer = await fetchRemoteResume(resumeUrl);
    }

    const parsed = await parseResume(pdfBuffer);

    const completion = await generateObject({
      model: "google/gemini-2.5-flash",
      temperature: 0,
      system: getSysPrompt(parsed?.info?.Author),
      messages: messages(pdfBuffer),
      schema: ResponseSchema,
      abortSignal: gradingSignal,
      // A degenerate generation used to run until the 60s deadline; capping
      // tokens makes it fail fast instead of holding the request.
      maxOutputTokens: GRADING_MAX_OUTPUT_TOKENS,
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: GRADING_THINKING_BUDGET } },
      },
    });

    if (!completion) {
      throw new Error("GradingError");
    }

    console.info(
      JSON.stringify({
        "http.route": "/api/grade",
        outcome: "graded",
        finishReason: completion.finishReason,
        usage: completion.usage,
      }),
    );

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

    // Bad or hostile resume URLs are the caller's fault, and each carries a
    // stable code the badge can render.
    if (e instanceof ResumeFetchError) {
      console.warn(e);
      res.status(e.status).json({ error: e.code });
      return;
    }

    if (e instanceof InvalidResumePdfError) {
      console.warn(e.cause);
      res.status(400).json({
        error: "InvalidPDFException",
      });
      return;
    }

    if (gradingSignal.aborted) {
      console.error(e);
      res.status(504).json({ error: "GradingTimeout" });
      return;
    }

    // The SDK only retries APICallError, so a gateway 5xx surfaces on the
    // first attempt. It is an upstream outage, not a bug in this route. A 402
    // (team budget exceeded) or 429 (rate limited) clears up on its own too.
    if (GatewayError.isInstance(e) && isGatewayUnavailable(e.statusCode)) {
      console.error(e);
      res.status(503).json({ error: "GradingUnavailable" });
      return;
    }

    if (NoObjectGeneratedError.isInstance(e)) {
      console.error(
        JSON.stringify({
          "http.route": "/api/grade",
          outcome: "no_object_generated",
          finishReason: e.finishReason,
          usage: e.usage,
        }),
      );
      res.status(500).json({ error: "GradingError" });
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
