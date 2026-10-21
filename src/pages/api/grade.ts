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
import { createRouteLog, describeError } from "@/lib/route-log";
import { GatewayError } from "@ai-sdk/gateway";
import { generateObject, NoObjectGeneratedError } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";

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
  const log = createRouteLog<"upload" | "fetch" | "parse" | "model">(
    "/api/grade",
  );
  const reject = (status: number, error: string) => {
    log.info("bad_request", { code: error });
    res.status(status).json({ error });
  };

  // Bad requests are answered before the try block so they stay 4xx: crawlers
  // submit the resume-checker form as a GET and used to log a 500 per hit.
  if (!["POST", "GET"].includes(req.method || "")) {
    reject(405, "MethodNotAllowed");
    return;
  }

  const { url } = req.query;
  const resumeUrl = typeof url === "string" ? url.trim() : "";
  if (req.method === "GET" && !resumeUrl) {
    reject(400, "MissingURL");
    return;
  }

  if (req.method === "POST" && !isMultipartFormData(req)) {
    reject(400, "InvalidUploadRequest");
    return;
  }

  const gradingSignal = AbortSignal.timeout(GRADING_TIMEOUT_MS);
  const source = isMultipartFormData(req) ? "upload" : "url";
  let unparseablePdf = false;
  log.set({ source, pdfBytes: undefined, unparseablePdf });

  try {
    let pdfBuffer: Buffer;
    if (source === "upload") {
      log.phase("upload");
      // bodyParser is off, so nothing else bounds this stream: without the
      // running total a single request could buffer the whole heap away.
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_RESUME_BYTES) {
          req.destroy();
          reject(413, "ResumeTooLarge");
          return;
        }
        chunks.push(chunk);
      }
      pdfBuffer = Buffer.concat(chunks);
    } else {
      const exampleResponse = exampleResponses.get(resumeUrl);
      if (exampleResponse) {
        log.info("example");
        res.status(200).json(exampleResponse);
        return;
      }

      log.phase("fetch");
      pdfBuffer = await fetchRemoteResume(resumeUrl);
    }
    log.set({ pdfBytes: pdfBuffer.length });

    // pdf.js only supplies the author; Gemini reads the raw bytes itself, so
    // a PDF pdf.js chokes on can still be graded.
    let author: string | undefined;
    log.phase("parse");
    try {
      author = (await parseResume(pdfBuffer))?.info?.Author;
    } catch (e) {
      if (!(e instanceof InvalidResumePdfError)) throw e;
      unparseablePdf = true;
      log.set({ unparseablePdf, parseError: describeError(e.cause) });
    }

    log.phase("model");
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

    log.info("graded", {
      finishReason: completion.finishReason,
      usage: completion.usage,
      gateway: completion.providerMetadata?.gateway,
    });

    const sanitized = sanitizeCompletion(completion);

    res.status(200).json(sanitized);
  } catch (e) {
    // Bad or hostile resume URLs are the caller's fault, and each carries a
    // stable code the badge can render.
    if (e instanceof ResumeFetchError) {
      log.warn("resume_fetch_failed", { error: describeError(e) });
      res.status(e.status).json({ error: e.code });
      return;
    }

    // Only a document both pdf.js and the model reject counts as unreadable;
    // a 400 on a PDF that parsed is a bug in this request, not the file.
    if (unparseablePdf && GatewayError.isInstance(e) && e.statusCode === 400) {
      log.warn("invalid_pdf", { error: describeError(e) });
      res.status(400).json({
        error: "InvalidPDFException",
      });
      return;
    }

    // A stalled provider call is upstream and clears on retry; the same PDF
    // usually grades fine seconds later.
    if (gradingSignal.aborted) {
      log.warn("timeout", { error: describeError(e) });
      res.status(504).json({ error: "GradingTimeout" });
      return;
    }

    // The SDK only retries APICallError, so a gateway 5xx surfaces on the
    // first attempt. It is an upstream outage, not a bug in this route.
    if (log.gatewayUnavailable(e)) {
      res.status(503).json({ error: "GradingUnavailable" });
      return;
    }

    if (NoObjectGeneratedError.isInstance(e)) {
      log.error("no_object_generated", {
        finishReason: e.finishReason,
        usage: e.usage,
      });
      res.status(500).json({ error: "GradingError" });
      return;
    }

    // The client renders this string straight into a badge, so it must stay a
    // stable code rather than whatever the PDF parser or the model threw.
    log.unexpected(e);
    res.status(500).json({
      error: e instanceof Error ? "GradingError" : "UnknownError",
    });
  }
}

export const config = {
  maxDuration: 300,
  api: {
    bodyParser: false,
  },
};
