import { POST } from "@/app/roast-me/api/analyze/route";
import { GatewayInternalServerError } from "@ai-sdk/gateway";
import { streamObject } from "ai";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ capture: vi.fn() }),
}));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  streamObject: vi.fn(),
}));

async function streamFailsWith(error: unknown) {
  vi.mocked(streamObject).mockReturnValueOnce({
    toTextStreamResponse: () => new Response(),
  } as never);
  await POST({
    json: async () => ({ snapshot: "img", isUnhinged: false }),
  } as NextRequest);
  const { onError } = vi.mocked(streamObject).mock.calls[0][0];
  onError?.({ error });
}

describe("/roast-me/api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("logs a spent AI Gateway budget as a warning", async () => {
    await streamFailsWith(
      new GatewayInternalServerError({
        message: "Team budget exceeded. Current spend: $100.62, limit: $100.00.",
        statusCode: 402,
      }),
    );

    expect(console.warn).toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs any other stream failure as an error", async () => {
    await streamFailsWith(new GatewayInternalServerError({ statusCode: 503 }));

    expect(console.error).toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
