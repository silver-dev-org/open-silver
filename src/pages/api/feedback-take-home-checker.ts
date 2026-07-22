// TODO(refactor): DRY this endpoint and its related dialog with the equivalent of the Resume Checker

import { getResend } from "@/lib/resend";
import { TakeHomeCheckerData } from "@/takehome-checker/types";
import { codebaseToString } from "@/takehome-checker/utils";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const resend = getResend();
  if (!resend) {
    res.status(500).send({ message: "Email service is not configured" });
    return;
  }

  try {
    const data = req.body as TakeHomeCheckerData;
    const html = `<h1>Descripción</h1>
<p>${req.body.description}</p>

<h1>Contenido</h1>

<h2>Análisis</h2>
<pre>${JSON.stringify(data.analysis, null, 2)}</pre>

<h2>Take-home</h2>

<h3>README</h3>
<pre>${data.takeHome.docs}</pre>

<h3>Codebase</h3>
<pre>${codebaseToString(data.takeHome.code)}</pre>
`;

    const { error } = await resend.emails.send({
      from: "Take-home Checker <feedback@silver.dev>",
      to: ["engineering@silver.dev"],
      subject: "User feedback",
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false });
  }
}
