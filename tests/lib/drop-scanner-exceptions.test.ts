import { dropScannerExceptions } from "@/lib/analytics/drop-scanner-exceptions";
import type { CaptureResult } from "posthog-js";
import { describe, expect, it } from "vitest";

function exception(...values: string[]) {
  return {
    uuid: "1",
    event: "$exception",
    properties: {
      $exception_list: values.map((value) => ({
        type: "UnhandledRejection",
        value,
      })),
    },
  } as unknown as CaptureResult;
}

describe("dropScannerExceptions", () => {
  it("drops the SafeLinks rejection as PostHog wraps it", () => {
    expect(
      dropScannerExceptions(
        exception(
          "Non-Error promise rejection captured with value: Object Not Found Matching Id:2, MethodName:update, ParamCount:4",
        ),
      ),
    ).toBeNull();
  });

  it("drops the bare SafeLinks rejection", () => {
    expect(
      dropScannerExceptions(
        exception(
          "Object Not Found Matching Id:1, MethodName:update, ParamCount:4",
        ),
      ),
    ).toBeNull();
  });

  it("keeps real errors", () => {
    const event = exception("Failed to fetch");
    expect(dropScannerExceptions(event)).toBe(event);
  });

  it("keeps errors that only mention the scanner string", () => {
    const event = exception(
      "Object Not Found Matching Id:2, MethodName:update, ParamCount:4 while saving",
    );
    expect(dropScannerExceptions(event)).toBe(event);
  });

  it("keeps a chain that has a real error in it", () => {
    const event = exception(
      "Object Not Found Matching Id:2, MethodName:update, ParamCount:4",
      "Cannot read properties of undefined",
    );
    expect(dropScannerExceptions(event)).toBe(event);
  });

  it("leaves other events alone", () => {
    const event = {
      uuid: "1",
      event: "$pageview",
      properties: {},
    } as unknown as CaptureResult;
    expect(dropScannerExceptions(event)).toBe(event);
  });
});
