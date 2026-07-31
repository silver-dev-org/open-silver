// Dependency-free structured logger. Emits one JSON row per invocation.
// Adapted from candidate-portal/utils/structured-logger.ts.
// Field names follow OTel semantic conventions (http.route, error.type, ...);
// interim solution until we adopt @vercel/otel.

export type LogContext = Record<string, unknown>;

export type LoggerSink = (level: string, data: string) => void;

const consoleSink: LoggerSink = (level, data) => {
  if (level === "error") console.error(data);
  else if (level === "warn") console.warn(data);
  else console.info(data);
};

const REDACTED = new Set([
  "headers",
  "cookies",
  "authorization",
  "sql",
  "query",
  "params",
  "env",
  "secret",
  "token",
  "password",
  "key",
] as const);

interface ErrorFields {
  errorType?: string;
  errorMessage?: string;
}

export function createApiLogger(
  route: string,
  method: string,
  functionName: string,
  sink?: LoggerSink,
) {
  const startTime = Date.now();
  let context: Partial<LogContext> = {};
  const errorFields: ErrorFields = {};
  let emitted = false;

  return {
    setContext(fields: Partial<LogContext>) {
      const sanitizedFields = { ...fields };
      for (const key of REDACTED) {
        delete sanitizedFields[key];
      }
      context = { ...context, ...sanitizedFields };
    },

    error(err: unknown) {
      if (err instanceof Error) {
        errorFields.errorType = err.name;
        errorFields.errorMessage = err.message;
      } else if (typeof err === "string") {
        errorFields.errorType = "string";
        errorFields.errorMessage = err;
      } else if (err !== null && err !== undefined) {
        errorFields.errorType = "unknown";
        errorFields.errorMessage = JSON.stringify(err);
      }
    },

    emit(): string {
      if (emitted) return "";
      emitted = true;

      const logRow: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level: Object.keys(errorFields).length > 0 ? "error" : "info",
        "http.route": route,
        "http.request.method": method,
        "code.function.name": functionName,
        "http.response.status_code": null,
        outcome: null,
        durationMs: Date.now() - startTime,
        ...context,
        ...(errorFields.errorType !== undefined && {
          "error.type": errorFields.errorType,
          "error.message": errorFields.errorMessage,
        }),
      };

      const json = JSON.stringify(logRow);
      (sink ?? consoleSink)(logRow.level as string, json);
      return json;
    },
  };
}

export type ApiLogger = ReturnType<typeof createApiLogger>;
