export const TYPST_TEMPLATE_URL =
  "https://typst.app/universe/package/silver-dev-cv";

export const DEFAULT_ERROR_MESSAGE = "Hubo un error inesperado";

/* Vercel rejects function payloads over 4.5MB itself, before the route runs. */
export const PAYLOAD_TOO_LARGE_MESSAGE =
  "El PDF es demasiado grande. Probá con uno de menos de 4.5 MB.";

/* Keys are the error codes /api/grade answers with. */
const ERROR_MESSAGES: Record<string, string> = {
  InvalidPDFException: "No pudimos leer el PDF. Probá con otro archivo.",
  InvalidUploadRequest: "No pudimos leer el archivo que subiste.",
  MissingURL: "No encontramos el CV que querías analizar.",
};

async function readErrorCode(response: Response) {
  try {
    const payload = await response.json();
    const code = payload?.error;
    return typeof code === "string" ? code : null;
  } catch {
    /* 413s, gateway timeouts and edge error pages are not JSON. */
    return null;
  }
}

/**
 * Turn a failed /api/grade response into copy worth showing in the error badge.
 * Nothing from the body reaches the user: the route answers with stable codes,
 * and platform failures (413, gateway timeouts) are not JSON at all.
 */
export async function getErrorMessage(response: Response) {
  if (response.status === 413) {
    return PAYLOAD_TOO_LARGE_MESSAGE;
  }

  const code = await readErrorCode(response);

  return (code && ERROR_MESSAGES[code]) || DEFAULT_ERROR_MESSAGE;
}
