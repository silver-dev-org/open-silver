"use client";

import Link from "next/link";

export default function Error() {
  return (
    <p className="text-center text-destructive">
      Ocurrió un error inesperado. Por favor, intenta nuevamente. Si el problema
      persiste, por favor{" "}
      <Link
        href="mailto:support@silver.dev?subject=Take-home%20Checker%20Error"
        className="underline hover:opacity-70"
      >
        contactanos
      </Link>
      .
    </p>
  );
}
