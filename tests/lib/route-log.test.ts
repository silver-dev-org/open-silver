import { createRouteLog } from "@/lib/route-log";
import { GatewayInternalServerError } from "@ai-sdk/gateway";
import { APIError } from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dash0Error =
  /^\{"http\.route":"([^"]+)","outcome":"([a-z_]+)".*"totalMs":([0-9]+).*"error":\{"name":"([^"]+)","message":"((?:[^"\\]|\\.)*)".*$/;

function lastLine(level: "info" | "warn" | "error") {
  return vi.mocked(console[level]).mock.calls.at(-1)?.[0] as string;
}

describe("createRouteLog", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes the route, outcome, context, timings and fields in that order", () => {
    const log = createRouteLog<"fetch">("/api/x");
    log.set({ source: "upload" });
    log.phase("fetch");
    log.info("done", { count: 2 });

    expect(Object.keys(JSON.parse(lastLine("info")))).toEqual([
      "http.route",
      "outcome",
      "source",
      "phase",
      "durationsMs",
      "totalMs",
      "count",
    ]);
  });

  it("leaves phase timings out when the route has no phases", () => {
    createRouteLog("/api/x").info("done");

    expect(JSON.parse(lastLine("info"))).toEqual({
      "http.route": "/api/x",
      outcome: "done",
      totalMs: expect.any(Number),
    });
  });

  it("writes errors in the shape the Dash0 error rule parses", () => {
    createRouteLog("/api/x").unexpected(new TypeError('bad "input"'));

    expect(lastLine("error")).toMatch(dash0Error);
    expect(lastLine("error").match(dash0Error)?.slice(1, 3)).toEqual([
      "/api/x",
      "error",
    ]);
  });

  it("names the missing variable", () => {
    createRouteLog("/api/x").misconfigured("RESEND_KEY");

    expect(JSON.parse(lastLine("error"))).toMatchObject({
      outcome: "misconfigured",
      error: { message: "RESEND_KEY is not set" },
    });
  });

  it("logs a spent gateway budget as a warning", () => {
    const handled = createRouteLog("/api/x").gatewayUnavailable(
      new GatewayInternalServerError({
        message:
          "Team budget exceeded. Current spend: $100.62, limit: $100.00.",
        statusCode: 402,
      }),
    );

    expect(handled).toBe(true);
    expect(console.error).not.toHaveBeenCalled();
    expect(JSON.parse(lastLine("warn"))).toMatchObject({
      outcome: "gateway_unavailable",
      error: { statusCode: 402 },
    });
  });

  it("logs an Anthropic SDK 5xx as an error", () => {
    const handled = createRouteLog("/api/x").gatewayUnavailable(
      APIError.generate(503, undefined, "down", new Headers()),
    );

    expect(handled).toBe(true);
    expect(lastLine("error")).toMatch(dash0Error);
  });

  it("leaves other failures to the caller", () => {
    const log = createRouteLog("/api/x");

    expect(log.gatewayUnavailable(new Error("boom"))).toBe(false);
    expect(
      log.gatewayUnavailable(
        APIError.generate(400, undefined, "bad", new Headers()),
      ),
    ).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
