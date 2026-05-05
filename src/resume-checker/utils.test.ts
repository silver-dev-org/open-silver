import {
  DEFAULT_RESUME_CHECKER_ERROR,
  getErrorMessage,
  RESUME_TOO_LARGE_ERROR,
} from "./utils";
import { describe, expect, it } from "vitest";

describe("getErrorMessage", () => {
  it("returns the json error field when present", async () => {
    const response = new Response(
      JSON.stringify({ error: "InvalidPDFException" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );

    await expect(getErrorMessage(response)).resolves.toBe(
      "InvalidPDFException",
    );
  });

  it("returns the json message field when present", async () => {
    const response = new Response(
      JSON.stringify({ message: "File is too large" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );

    await expect(getErrorMessage(response)).resolves.toBe("File is too large");
  });

  it("maps plain text 413 responses to a stable message", async () => {
    const response = new Response("Request Entity Too Large", {
      status: 413,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

    await expect(getErrorMessage(response)).resolves.toBe(
      RESUME_TOO_LARGE_ERROR,
    );
  });

  it("falls back to the text body for non-json errors", async () => {
    const response = new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

    await expect(getErrorMessage(response)).resolves.toBe(
      "Internal Server Error",
    );
  });

  it("uses the default message when the response body is empty", async () => {
    const response = new Response(null, { status: 500 });

    await expect(getErrorMessage(response)).resolves.toBe(
      DEFAULT_RESUME_CHECKER_ERROR,
    );
  });
});
