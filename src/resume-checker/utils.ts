export const TYPST_TEMPLATE_URL =
  "https://typst.app/universe/package/silver-dev-cv";

export const DEFAULT_RESUME_CHECKER_ERROR = "Hubo un error inesperado";
export const RESUME_TOO_LARGE_ERROR =
  "El PDF es demasiado grande. Probá con un archivo más chico.";

type ErrorPayload = {
  error?: string;
  message?: string;
};

function getErrorPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { error, message } = payload as ErrorPayload;

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  return null;
}

export async function getErrorMessage(response: Response) {
  if (response.status === 413) {
    return RESUME_TOO_LARGE_ERROR;
  }

  const text = await response.text();

  if (!text) {
    return DEFAULT_RESUME_CHECKER_ERROR;
  }

  try {
    return getErrorPayloadMessage(JSON.parse(text)) || text;
  } catch {
    return text;
  }
}
