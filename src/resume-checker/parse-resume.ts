import pdf from "pdf-parse";
import { PDFJS_WARNING_PREFIX } from "./constants";

let activeParses = 0;
let restoreConsoleLog = () => {};

/*
 * pdf-parse's bundled pdf.js reports font and structure problems through
 * console.log, so they land as INFO. Route them to console.warn while any
 * parse is in flight; the counter keeps concurrent requests from restoring
 * the original logger under each other.
 */
function forwardPdfjsWarnings() {
  const log = console.log;
  console.log = (...args: unknown[]) => {
    const [message] = args;
    if (
      typeof message === "string" &&
      message.startsWith(PDFJS_WARNING_PREFIX)
    ) {
      console.warn(...args);
      return;
    }
    log(...args);
  };
  restoreConsoleLog = () => {
    console.log = log;
  };
}

export async function parseResume(buffer: Buffer) {
  if (activeParses++ === 0) {
    forwardPdfjsWarnings();
  }

  try {
    return await pdf(buffer);
  } finally {
    if (--activeParses === 0) {
      restoreConsoleLog();
    }
  }
}
