import {
  DEFAULT_ERROR_MESSAGE,
  getErrorMessage,
  PAYLOAD_TOO_LARGE_MESSAGE,
} from "@/resume-checker/utils";
import { describe, expect, it } from "vitest";

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function text(status: number, body: string) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain" },
  });
}

describe("getErrorMessage", () => {
  it("translates the error codes the route answers with", async () => {
    await expect(
      getErrorMessage(json(400, { error: "InvalidPDFException" })),
    ).resolves.toBe("No pudimos leer el PDF. Probá con otro archivo.");
    await expect(
      getErrorMessage(json(400, { error: "InvalidUploadRequest" })),
    ).resolves.toBe("No pudimos leer el archivo que subiste.");
    await expect(
      getErrorMessage(json(400, { error: "MissingURL" })),
    ).resolves.toBe("No encontramos el CV que querías analizar.");
  });

  /* Vercel rejects oversized uploads itself, with a plain-text body. */
  it("explains a payload rejected before the route ran", async () => {
    await expect(
      getErrorMessage(text(413, "Request Entity Too Large")),
    ).resolves.toBe(PAYLOAD_TOO_LARGE_MESSAGE);
  });

  it("falls back to the default message instead of throwing on non-JSON", async () => {
    await expect(
      getErrorMessage(text(504, "<html>Gateway Timeout</html>")),
    ).resolves.toBe(DEFAULT_ERROR_MESSAGE);
    await expect(
      getErrorMessage(new Response(null, { status: 500 })),
    ).resolves.toBe(DEFAULT_ERROR_MESSAGE);
  });

  it("never renders an unrecognized code or payload shape", async () => {
    await expect(
      getErrorMessage(json(500, { error: "GradingError" })),
    ).resolves.toBe(DEFAULT_ERROR_MESSAGE);
    await expect(
      getErrorMessage(json(500, { error: { code: 7 } })),
    ).resolves.toBe(DEFAULT_ERROR_MESSAGE);
    await expect(getErrorMessage(json(500, {}))).resolves.toBe(
      DEFAULT_ERROR_MESSAGE,
    );
  });
});
