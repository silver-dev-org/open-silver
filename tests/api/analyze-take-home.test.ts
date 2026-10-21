import handler from "@/pages/api/analyze-take-home";
import { getFileContent, getOctokit, getRepoFilePaths } from "@/lib/github";
import { analyzeTakeHome } from "@/takehome-checker";
import { APIError } from "@anthropic-ai/sdk";
import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("formidable", () => ({
  default: () => ({
    parse: async () => [{ installationId: "1", name: "candidate/store" }, {}],
  }),
}));
vi.mock("@/lib/github", () => ({
  getOctokit: vi.fn(),
  getRepoFilePaths: vi.fn(),
  getFileContent: vi.fn(),
}));
vi.mock("@/takehome-checker", () => ({ analyzeTakeHome: vi.fn() }));

const readme = `# Store\n\n${"A small store with a cart and checkout. ".repeat(6)}`;

function response() {
  const spy = { status: 200, body: undefined as unknown };
  const send = (payload: unknown) => {
    spy.body = payload;
    return res;
  };
  const res = Object.assign(spy, {
    status(code: number) {
      spy.status = code;
      return res;
    },
    send,
    json: send,
  });
  return res as unknown as NextApiResponse & { status: number; body: unknown };
}

async function call() {
  const res = response();
  await handler({} as NextApiRequest, res);
  return res as unknown as { status: number; body: unknown };
}

function loggedLine(log: "info" | "warn" | "error") {
  const line = vi.mocked(console[log]).mock.calls.at(-1)?.[0];
  return JSON.parse(line as string);
}

describe("/api/analyze-take-home", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubEnv("AI_GATEWAY_API_KEY", "vck_test");
    vi.mocked(getOctokit).mockResolvedValue({
      request: async () => ({ data: { private: true } }),
    } as unknown as Awaited<ReturnType<typeof getOctokit>>);
    vi.mocked(getRepoFilePaths).mockResolvedValue([
      { path: "README.md", size: readme.length },
      { path: "src/index.ts", size: 20 },
    ]);
    vi.mocked(getFileContent).mockImplementation(async (_, __, path) =>
      path === "README.md" ? readme : "export const a = 1;",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs one line with the outcome of an analysis", async () => {
    vi.mocked(analyzeTakeHome).mockResolvedValue({
      rubric: "fullstack",
      findings: [],
      passed: [],
    } as unknown as Awaited<ReturnType<typeof analyzeTakeHome>>);

    const res = await call();

    expect(res.status).toBe(200);
    expect(loggedLine("info")).toMatchObject({
      "http.route": "/api/analyze-take-home",
      outcome: "analyzed",
      source: "repo",
      fileCount: 2,
      isPrivate: true,
      findings: 0,
    });
  });

  it("names the missing gateway key instead of calling the model", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");

    const res = await call();

    expect(res.status).toBe(503);
    expect(analyzeTakeHome).not.toHaveBeenCalled();
    expect(loggedLine("error")).toMatchObject({
      outcome: "misconfigured",
      error: { message: "AI_GATEWAY_API_KEY is not set" },
    });
  });

  it("logs a spent gateway budget as a warning", async () => {
    vi.mocked(analyzeTakeHome).mockRejectedValue(
      APIError.generate(
        402,
        { error: { message: "budget" } },
        "budget",
        new Headers(),
      ),
    );

    const res = await call();

    expect(res.status).toBe(503);
    expect(console.error).not.toHaveBeenCalled();
    expect(loggedLine("warn")).toMatchObject({
      outcome: "gateway_unavailable",
      error: { statusCode: 402 },
    });
  });

  it("logs an unexpected failure with its stack", async () => {
    vi.mocked(analyzeTakeHome).mockRejectedValue(new Error("boom"));

    const res = await call();

    expect(res.status).toBe(500);
    expect(loggedLine("error")).toMatchObject({
      outcome: "error",
      error: { name: "Error", message: "boom", stack: expect.any(String) },
    });
  });
});
