import { POST } from "@/app/roast-me/api/realtime-token/route";
import {
  REALTIME_TOKEN_TTL_SECONDS,
  REALTIME_TRANSCRIPTION_MODEL,
} from "@/roast-me/constants";
import { gateway, GatewayRateLimitError } from "@ai-sdk/gateway";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getToken = vi.spyOn(gateway.experimental_transcription, "getToken");

describe("/roast-me/api/realtime-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("mints a short-lived gateway transcription token", async () => {
    getToken.mockResolvedValueOnce({
      token: "vcst_abc",
      url: "wss://ai-gateway.vercel.sh/v4/ai/transcription-model",
    });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: "vcst_abc" });
    expect(getToken).toHaveBeenCalledWith({
      model: REALTIME_TRANSCRIPTION_MODEL,
      expiresAfterSeconds: REALTIME_TOKEN_TTL_SECONDS,
    });
  });

  it("answers 503 when the gateway is rate limited", async () => {
    getToken.mockRejectedValueOnce(new GatewayRateLimitError());

    const res = await POST();

    expect(res.status).toBe(503);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"outcome":"gateway_unavailable"'),
    );
  });

  it("answers 500 on unexpected errors", async () => {
    getToken.mockRejectedValueOnce(new Error("boom"));

    const res = await POST();

    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"outcome":"error"'),
    );
  });
});
