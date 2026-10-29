import type { CaptureResult } from "posthog-js";

/**
 * Outlook SafeLinks and Microsoft Defender open links in a sandboxed browser
 * whose injected script rejects with this exact string. It is never thrown by
 * our code, so matching it whole keeps real rejections reported.
 */
const SCANNER_REJECTION =
  /^(Non-Error promise rejection captured with value: )?Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+$/;

export function dropScannerExceptions(
  event: CaptureResult | null,
): CaptureResult | null {
  if (event?.event !== "$exception") return event;

  const exceptions: { value?: unknown }[] =
    event.properties?.$exception_list ?? [];
  const fromScanner =
    exceptions.length > 0 &&
    exceptions.every(
      ({ value }) => typeof value === "string" && SCANNER_REJECTION.test(value),
    );

  return fromScanner ? null : event;
}
