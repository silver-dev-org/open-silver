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
import { createPhaseTimer } from "@/resume-checker/utils";
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

function logGrade(
  log: (line: string) => void,
  fields: Record<string, unknown>,
) {
  log(JSON.stringify({ "http.route": "/api/grade", ...fields }));
}

function describeError(e: Error) {
  return {
    name: e.name,
    message: e.message,
    statusCode: GatewayError.isInstance(e) ? e.statusCode : undefined,
  };
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
  const timer = createPhaseTimer<"upload" | "fetch" | "parse" | "model">();
  const source = isMultipartFormData(req) ? "upload" : "url";
  let pdfBytes: number | undefined;
  let unparseablePdf = false;

  // One line per request says where the time went, so a timeout shows
  // whether the model, the resume download or the upload stalled.
  const context = () => ({
    source,
    pdfBytes,
    unparseablePdf,
    ...timer.summary(),
  });

  try {
    let pdfBuffer: Buffer;
    if (source === "upload") {
      timer.start("upload");
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

      timer.start("fetch");
      pdfBuffer = await fetchRemoteResume(resumeUrl);
    }
    pdfBytes = pdfBuffer.length;

    // pdf.js only supplies the author; Gemini reads the raw bytes itself, so
    // a PDF pdf.js chokes on can still be graded.
    let author: string | undefined;
    timer.start("parse");
    try {
      author = (await parseResume(pdfBuffer))?.info?.Author;
    } catch (e) {
      if (!(e instanceof InvalidResumePdfError)) throw e;
      console.warn(e.cause);
      unparseablePdf = true;
    }

    timer.start("model");
    const completion = await generateObject({
      model: "google/gemini-2.5-flash",
      temperature: 0,
      system: getSysPrompt(author),
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

    logGrade(console.info, {
      outcome: "graded",
      ...context(),
      finishReason: completion.finishReason,
      usage: completion.usage,
      gateway: completion.providerMetadata?.gateway,
    });

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
      logGrade(console.warn, {
        outcome: "resume_fetch_failed",
        ...context(),
        error: describeError(e),
      });
      res.status(e.status).json({ error: e.code });
      return;
    }

    // Only a document both pdf.js and the model reject counts as unreadable;
    // a 400 on a PDF that parsed is a bug in this request, not the file.
    if (unparseablePdf && GatewayError.isInstance(e) && e.statusCode === 400) {
      logGrade(console.warn, {
        outcome: "invalid_pdf",
        ...context(),
        error: describeError(e),
      });
      res.status(400).json({
        error: "InvalidPDFException",
      });
      return;
    }

    // A stalled provider call is upstream and clears on retry; the same PDF
    // usually grades fine seconds later.
    if (gradingSignal.aborted) {
      logGrade(console.warn, {
        outcome: "timeout",
        ...context(),
        error: describeError(e),
      });
      res.status(504).json({ error: "GradingTimeout" });
      return;
    }

    // The SDK only retries APICallError, so a gateway 5xx surfaces on the
    // first attempt. It is an upstream outage, not a bug in this route. A 402
    // (team budget exceeded) or 429 (rate limited) clears up on its own too.
    if (GatewayError.isInstance(e) && isGatewayUnavailable(e.statusCode)) {
      logGrade(e.statusCode === 402 ? console.warn : console.error, {
        outcome: "gateway_unavailable",
        ...context(),
        error: describeError(e),
      });
      res.status(503).json({ error: "GradingUnavailable" });
      return;
    }

    if (NoObjectGeneratedError.isInstance(e)) {
      logGrade(console.error, {
        outcome: "no_object_generated",
        ...context(),
        finishReason: e.finishReason,
        usage: e.usage,
      });
      res.status(500).json({ error: "GradingError" });
      return;
    }

    // The client renders this string straight into a badge, so it must stay a
    // stable code rather than whatever the PDF parser or the model threw.
    logGrade(console.error, {
      outcome: "error",
      ...context(),
      error: { ...describeError(e), stack: e.stack },
    });
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
