import handler from "@/pages/api/grade";
import { exampleResponses } from "@/resume-checker/prompts/grade";
import { generateObject } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";
import type { IncomingHttpHeaders } from "node:http";
import { Readable } from "node:stream";
import pdf from "pdf-parse";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({ default: vi.fn() }));
vi.mock("ai", () => ({ generateObject: vi.fn() }));

const MULTIPART = { "content-type": "multipart/form-data; boundary=abc" };

function request({
  method = "GET",
  headers = {},
  query = {},
  body = "",
}: {
  method?: string;
  headers?: IncomingHttpHeaders;
  query?: NextApiRequest["query"];
  body?: string;
} = {}) {
  return Object.assign(Readable.from([Buffer.from(body)]), {
    method,
    headers,
    query,
  }) as unknown as NextApiRequest;
}

function response() {
  const spy = {
    status: 200,
    body: undefined as unknown,
    json(payload: unknown) {
      spy.body = payload;
      return spy;
    },
  };

  return Object.assign(spy, {
    status(code: number) {
      spy.status = code;
      return spy;
    },
  }) as unknown as NextApiResponse & { status: number; body: unknown };
}

async function call(req: NextApiRequest) {
  const res = response();
  await handler(req, res);
  return res as unknown as { status: number; body: unknown };
}

describe("/api/grade", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serves the canned grade for example resumes without calling the model", async () => {
    const res = await call(request({ query: { url: "public/a_resume.pdf" } }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(exampleResponses.get("public/a_resume.pdf"));
    expect(pdf).not.toHaveBeenCalled();
    expect(generateObject).not.toHaveBeenCalled();
  });

  it("grades an uploaded resume", async () => {
    vi.mocked(pdf).mockResolvedValueOnce({ text: "cv" } as never);
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { grade: "B", red_flags: ["flag"], yellow_flags: [] },
    } as never);

    const res = await call(
      request({ method: "POST", headers: MULTIPART, body: "pdf-bytes" }),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grade: "B",
      red_flags: ["flag"],
      yellow_flags: [],
    });
    expect(vi.mocked(pdf).mock.calls[0][0]).toEqual(Buffer.from("pdf-bytes"));
  });

  /* Crawlers submit the resume-checker form as a GET, so these must not be 500s. */
  it.each([
    ["no url", {}],
    ["a blank url", { url: "   " }],
    ["only the honeypot field", { name: "2026" }],
    ["a repeated url", { url: ["a", "b"] }],
  ])("answers 400 to a GET with %s", async (_label, query) => {
    const res = await call(request({ query }));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "MissingURL" });
  });

  /* The URL is caller-supplied, so the route must not be a proxy into the VPC. */
  it.each([
    ["loopback", "https://127.0.0.1/cv.pdf"],
    ["cloud metadata", "https://169.254.169.254/latest/meta-data/"],
    ["decimal-encoded loopback", "https://2130706433/cv.pdf"],
  ])("answers 400 to a GET for %s", async (_label, url) => {
    const res = await call(request({ query: { url } }));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "BlockedResumeURL" });
    expect(pdf).not.toHaveBeenCalled();
  });

  it("answers 400 to a GET for a non-https url", async () => {
    const res = await call(request({ query: { url: "file:///etc/passwd" } }));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "InvalidResumeURL" });
  });

  /* bodyParser is off, so nothing else bounds the upload stream. */
  it("answers 413 to an upload over the size cap", async () => {
    const res = await call(
      request({
        method: "POST",
        headers: MULTIPART,
        body: "x".repeat(10 * 1024 * 1024 + 1),
      }),
    );

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: "ResumeTooLarge" });
    expect(pdf).not.toHaveBeenCalled();
  });

  it("answers 405 to unsupported methods", async () => {
    const res = await call(request({ method: "PUT" }));

    expect(res.status).toBe(405);
    expect(res.body).toEqual({ error: "MethodNotAllowed" });
  });

  it("answers 400 to a POST that is not a file upload", async () => {
    const res = await call(
      request({
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "InvalidUploadRequest" });
    expect(pdf).not.toHaveBeenCalled();
  });

  it("answers 400 to an unreadable PDF", async () => {
    vi.mocked(pdf).mockRejectedValueOnce(
      new Error("InvalidPDFException: nope"),
    );

    const res = await call(
      request({ method: "POST", headers: MULTIPART, body: "not-a-pdf" }),
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "InvalidPDFException" });
    expect(generateObject).not.toHaveBeenCalled();
  });

  /* The client renders this straight into a badge, so it must stay a code. */
  it("hides the underlying message when grading fails", async () => {
    vi.mocked(pdf).mockResolvedValueOnce({ text: "cv" } as never);
    vi.mocked(generateObject).mockRejectedValueOnce(
      new Error("A positive credit balance is required"),
    );

    const res = await call(
      request({ method: "POST", headers: MULTIPART, body: "pdf-bytes" }),
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "GradingError" });
  });

  it("answers 500 to a thrown non-Error", async () => {
    vi.mocked(pdf).mockRejectedValueOnce("boom");

    const res = await call(
      request({ method: "POST", headers: MULTIPART, body: "pdf-bytes" }),
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "UnknownError" });
  });
});
