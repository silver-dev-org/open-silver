import handler from "./grade";
import { exampleResponses } from "@/resume-checker/prompts/grade";
import { Readable } from "node:stream";
import type { IncomingHttpHeaders } from "node:http";
import type { NextApiRequest, NextApiResponse } from "next";
import pdf from "pdf-parse";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(),
}));

type RequestOptions = {
  method?: string;
  headers?: IncomingHttpHeaders;
  query?: NextApiRequest["query"];
  body?: Buffer | string | Uint8Array;
};

function createRequest({
  method = "GET",
  headers = {},
  query = {},
  body,
}: RequestOptions = {}) {
  const stream = Readable.from(
    body === undefined
      ? []
      : [Buffer.isBuffer(body) ? body : Buffer.from(body)],
  );

  return Object.assign(stream, {
    method,
    headers,
    query,
  }) as NextApiRequest;
}

function serializeBody(body: unknown) {
  if (body === undefined || body === null) {
    return "";
  }

  if (Buffer.isBuffer(body)) {
    return body.toString("utf8");
  }

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString("utf8");
  }

  return JSON.stringify(body);
}

function createResponse() {
  const headers: Record<string, string | string[]> = {};
  let bodyText = "";

  const response = {
    statusCode: 200,
    setHeader(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
      return response;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    getHeaders() {
      return { ...headers };
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.setHeader("content-type", "application/json; charset=utf-8");
      bodyText = serializeBody(body);
      return response;
    },
    send(body: unknown) {
      bodyText = serializeBody(body);
      return response;
    },
    end(body?: unknown) {
      bodyText = serializeBody(body);
      return response;
    },
  } as unknown as NextApiResponse & {
    getHeaders: () => Record<string, string | string[]>;
  };

  return {
    response,
    get body() {
      return bodyText;
    },
    get headers() {
      return response.getHeaders();
    },
  };
}

describe("/api/grade handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns example response for known public url", async () => {
    const request = createRequest({
      method: "GET",
      query: { url: "public/a_resume.pdf" },
    });
    const responseSpy = createResponse();

    await handler(request, responseSpy.response);

    expect(responseSpy.response.statusCode).toBe(200);
    expect(responseSpy.response.getHeader("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(JSON.parse(responseSpy.body)).toEqual(
      exampleResponses.get("public/a_resume.pdf"),
    );
    expect(pdf).not.toHaveBeenCalled();
    expect(generateObject).not.toHaveBeenCalled();
    expect(google).not.toHaveBeenCalled();
  });

  it("returns a mocked grading success response for uploaded resumes", async () => {
    vi.mocked(pdf).mockResolvedValueOnce({
      text: "parsed pdf",
      info: { Author: "silver" },
    } as never);
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        grade: "B",
        red_flags: ["Needs more impact"],
        yellow_flags: ["Tighten the summary"],
      },
    } as never);

    const request = createRequest({
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=abc123",
      },
      query: { url: "uploaded-resume.pdf" },
      body: "resume-bytes",
    });
    const responseSpy = createResponse();

    await handler(request, responseSpy.response);

    expect(responseSpy.response.statusCode).toBe(200);
    expect(responseSpy.response.getHeader("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(JSON.parse(responseSpy.body)).toEqual({
      grade: "B",
      red_flags: ["Needs more impact"],
      yellow_flags: ["Tighten the summary"],
    });
    expect(pdf).toHaveBeenCalledTimes(1);
    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(google).toHaveBeenCalledWith("gemini-2.5-flash");
  });

  it("returns 405 json for unsupported methods", async () => {
    const request = createRequest({
      method: "PUT",
    });
    const responseSpy = createResponse();

    await handler(request, responseSpy.response);

    expect(responseSpy.response.statusCode).toBe(405);
    expect(responseSpy.response.getHeader("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(JSON.parse(responseSpy.body)).toEqual({
      error: "Method not allowed",
    });
  });

  it("returns 400 json for missing or invalid get url", async () => {
    const missingUrlRequest = createRequest({
      method: "GET",
    });
    const missingUrlResponse = createResponse();

    await handler(missingUrlRequest, missingUrlResponse.response);

    expect(missingUrlResponse.response.statusCode).toBe(400);
    expect(JSON.parse(missingUrlResponse.body)).toEqual({
      error: "MissingURL",
    });

    const arrayUrlRequest = createRequest({
      method: "GET",
      query: { url: ["one", "two"] },
    });
    const arrayUrlResponse = createResponse();

    await handler(arrayUrlRequest, arrayUrlResponse.response);

    expect(arrayUrlResponse.response.statusCode).toBe(400);
    expect(JSON.parse(arrayUrlResponse.body)).toEqual({
      error: "MissingURL",
    });
  });

  it("returns 400 json for non-multipart post requests", async () => {
    const request = createRequest({
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      query: { url: "public/a_resume.pdf" },
    });
    const responseSpy = createResponse();

    await handler(request, responseSpy.response);

    expect(responseSpy.response.statusCode).toBe(400);
    expect(responseSpy.response.getHeader("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(JSON.parse(responseSpy.body)).toEqual({
      error: "InvalidUploadRequest",
    });
  });

  it("returns invalid pdf as 400 json", async () => {
    vi.mocked(pdf).mockRejectedValueOnce(
      new Error("InvalidPDFException: bad pdf"),
    );

    const request = createRequest({
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=abc123",
      },
      query: { url: "public/a_resume.pdf" },
      body: "resume-bytes",
    });
    const responseSpy = createResponse();

    await handler(request, responseSpy.response);

    expect(responseSpy.response.statusCode).toBe(400);
    expect(responseSpy.response.getHeader("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(JSON.parse(responseSpy.body)).toEqual({
      error: "InvalidPDFException",
    });
    expect(generateObject).not.toHaveBeenCalled();
  });

  it("returns unknown error as 500 json", async () => {
    vi.mocked(pdf).mockRejectedValueOnce("not-an-error");

    const request = createRequest({
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=abc123",
      },
      query: { url: "public/a_resume.pdf" },
      body: "resume-bytes",
    });
    const responseSpy = createResponse();

    await handler(request, responseSpy.response);

    expect(responseSpy.response.statusCode).toBe(500);
    expect(responseSpy.response.getHeader("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(JSON.parse(responseSpy.body)).toEqual({
      error: "UnknownError",
    });
    expect(generateObject).not.toHaveBeenCalled();
  });

  it("returns generic errors as 500 json", async () => {
    vi.mocked(pdf).mockResolvedValueOnce({
      text: "parsed pdf",
    } as never);
    vi.mocked(generateObject).mockRejectedValueOnce(new Error("GradingError"));

    const request = createRequest({
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=abc123",
      },
      query: { url: "public/a_resume.pdf" },
      body: "resume-bytes",
    });
    const responseSpy = createResponse();

    await handler(request, responseSpy.response);

    expect(responseSpy.response.statusCode).toBe(500);
    expect(responseSpy.response.getHeader("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(JSON.parse(responseSpy.body)).toEqual({
      error: "GradingError",
    });
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it("captures status headers and body from json responses", () => {
    const jsonResponse = createResponse();

    jsonResponse.response
      .status(201)
      .setHeader("x-trace-id", "json-1")
      .json({ ok: true });

    expect(jsonResponse.response.statusCode).toBe(201);
    expect(jsonResponse.headers).toEqual(
      expect.objectContaining({
        "content-type": "application/json; charset=utf-8",
        "x-trace-id": "json-1",
      }),
    );
    expect(jsonResponse.body).toBe(JSON.stringify({ ok: true }));

    const sendResponse = createResponse();

    sendResponse.response.status(202).setHeader("x-trace-id", "send-1").send({
      ok: "send",
    });

    expect(sendResponse.response.statusCode).toBe(202);
    expect(sendResponse.headers).toEqual(
      expect.objectContaining({
        "x-trace-id": "send-1",
      }),
    );
    expect(sendResponse.body).toBe(JSON.stringify({ ok: "send" }));

    const endResponse = createResponse();

    endResponse.response
      .status(203)
      .setHeader("x-trace-id", "end-1")
      .end(Buffer.from("done"));

    expect(endResponse.response.statusCode).toBe(203);
    expect(endResponse.headers).toEqual(
      expect.objectContaining({
        "x-trace-id": "end-1",
      }),
    );
    expect(endResponse.body).toBe("done");
  });

  it("builds readable requests with method headers query and body", async () => {
    const request = createRequest({
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=abc123",
        "x-request-id": "req-1",
      },
      query: { url: "public/b_resume.pdf" },
      body: "resume-bytes",
    });

    const chunks: Buffer[] = [];

    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    expect(request.method).toBe("POST");
    expect(request.headers["content-type"]).toBe(
      "multipart/form-data; boundary=abc123",
    );
    expect(request.headers["x-request-id"]).toBe("req-1");
    expect(request.query).toEqual({ url: "public/b_resume.pdf" });
    expect(Buffer.concat(chunks).toString("utf8")).toBe("resume-bytes");
  });
});

export default function GradeRouteTestHarness() {}
