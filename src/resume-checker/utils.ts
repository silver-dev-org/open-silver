export const TYPST_TEMPLATE_URL =
  "https://typst.app/universe/package/silver-dev-cv";

export const DEFAULT_ERROR_MESSAGE = "Hubo un error inesperado";

/* Vercel rejects function payloads over 4.5MB itself, before the route runs. */
export const PAYLOAD_TOO_LARGE_MESSAGE =
  "El PDF es demasiado grande. Probá con uno de menos de 4.5 MB.";

/* Keys are the error codes /api/grade answers with. */
const ERROR_MESSAGES: Record<string, string> = {
  BlockedResumeURL: "Ese link no apunta a un CV que podamos descargar.",
  InvalidPDFException: "No pudimos leer el PDF. Probá con otro archivo.",
  InvalidResumeURL: "El link no es válido. Tiene que ser un PDF con https.",
  InvalidUploadRequest: "No pudimos leer el archivo que subiste.",
  MissingURL: "No encontramos el CV que querías analizar.",
  ResumeFetchTimeout:
    "El link tardó demasiado en responder. Probá subiendo el archivo.",
  ResumeTooLarge:
    "El PDF es demasiado grande. Probá con uno de menos de 10 MB.",
  ResumeURLUnreachable: "No pudimos descargar el CV desde ese link.",
  TooManyRedirects: "No pudimos descargar el CV desde ese link.",
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
  /* The route's own 413 carries a code and its own limit; Vercel's does not. */
  const code = await readErrorCode(response);

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  if (response.status === 413) {
    return PAYLOAD_TOO_LARGE_MESSAGE;
  }

  return DEFAULT_ERROR_MESSAGE;
}
