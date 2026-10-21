import { GatewayError } from "@ai-sdk/gateway";
import { APIError } from "@anthropic-ai/sdk";

type Fields = Record<string, unknown>;

export function createPhaseTimer<Phase extends string>() {
  const startedAt = performance.now();
  const durationsMs: Partial<Record<Phase, number>> = {};
  let phase: Phase | undefined;
  let phaseStartedAt = startedAt;

  function stop() {
    if (phase)
      durationsMs[phase] = Math.round(performance.now() - phaseStartedAt);
  }

  return {
    start(next: Phase) {
      stop();
      phase = next;
      phaseStartedAt = performance.now();
    },
    summary() {
      stop();
      const totalMs = Math.round(performance.now() - startedAt);
      return phase ? { phase, durationsMs, totalMs } : { totalMs };
    },
  };
}

export function gatewayStatus(e: unknown) {
  if (GatewayError.isInstance(e)) return e.statusCode;
  if (e instanceof APIError) return e.status;
  return undefined;
}

export function describeError(e: unknown) {
  if (!(e instanceof Error)) return { name: "NonError", message: String(e) };
  return { name: e.name, message: e.message, statusCode: gatewayStatus(e) };
}

/**
 * One JSON line per request, shaped
 * `{"http.route", "outcome", ...context, phase?, durationsMs?, totalMs, ...fields}`.
 * The Dash0 "exists error in production" rule parses that order, so keep
 * `http.route` and `outcome` first and `error` after `totalMs`.
 */
export function createRouteLog<Phase extends string = never>(route: string) {
  const timer = createPhaseTimer<Phase>();
  let context: Fields = {};

  function emit(
    write: (line: string) => void,
    outcome: string,
    fields: Fields,
  ) {
    write(
      JSON.stringify({
        "http.route": route,
        outcome,
        ...context,
        ...timer.summary(),
        ...fields,
      }),
    );
  }

  return {
    phase(next: Phase) {
      timer.start(next);
    },
    set(fields: Fields) {
      context = { ...context, ...fields };
    },
    info: (outcome: string, fields: Fields = {}) =>
      emit((line) => console.info(line), outcome, fields),
    warn: (outcome: string, fields: Fields = {}) =>
      emit((line) => console.warn(line), outcome, fields),
    error: (outcome: string, fields: Fields = {}) =>
      emit((line) => console.error(line), outcome, fields),
    /**
     * Logs a spent budget (402), rate limit (429) or gateway 5xx and returns
     * true. They clear up on their own, so callers answer 503; the budget is
     * a warning with its own Dash0 rule.
     */
    gatewayUnavailable(e: unknown) {
      const status = gatewayStatus(e);
      if (status !== 402 && status !== 429 && !(status && status >= 500))
        return false;
      emit(
        (line) => (status === 402 ? console.warn(line) : console.error(line)),
        "gateway_unavailable",
        { error: describeError(e) },
      );
      return true;
    },
    misconfigured(variable: string) {
      emit((line) => console.error(line), "misconfigured", {
        error: { name: "Misconfigured", message: `${variable} is not set` },
      });
    },
    unexpected(e: unknown) {
      emit((line) => console.error(line), "error", {
        error: {
          ...describeError(e),
          stack: e instanceof Error ? e.stack : undefined,
        },
      });
    },
  };
}

export type RouteLog = ReturnType<typeof createRouteLog<string>>;
