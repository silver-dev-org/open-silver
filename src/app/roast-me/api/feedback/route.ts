import { getPostHogClient } from "@/lib/posthog-server";
import { getResend } from "@/lib/resend";
import { FeedbackRequest } from "@/roast-me/types";
import { NextRequest, NextResponse } from "next/server";
import { createRouteLog } from "@/lib/route-log";

export async function POST(req: NextRequest) {
  const log = createRouteLog("/roast-me/api/feedback");
  const resend = getResend();

  if (!resend) {
    log.misconfigured("RESEND_KEY");
    return NextResponse.json(
      { error: "Email service is not configured" },
      { status: 503 },
    );
  }

  try {
    const data: FeedbackRequest = await req.json();

    const html = `<h1>Feedback</h1>
<p>${data.description}</p>

<h1>Analysis</h1>
<pre>${JSON.stringify(data.analysis, null, 2)}</pre>

<h2>Mode</h2>
<p>${data.isUnhinged ? "Unhinged" : "Normal"}</p>

<h2>Snapshot</h2>
`;

    const base64Data = data.snapshot
      ? data.snapshot.replace(/^data:image\/\w+;base64,/, "")
      : null;

    const { error } = await resend.emails.send({
      from: "Roast Me <feedback@notifications.silver.dev>",
      to: ["engineering@silver.dev"],
      subject: "User feedback",
      attachments: base64Data
        ? [{ filename: "snapshot.png", content: base64Data }]
        : [],
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "anonymous",
      event: "roast_me_api_feedback_received",
      properties: {
        mode: data.isUnhinged ? "unhinged" : "standard",
        score: data.analysis.score,
        feedback_length: data.description.length,
        green_flags_count: data.analysis.flags.green.length,
        yellow_flags_count: data.analysis.flags.yellow.length,
        red_flags_count: data.analysis.flags.red.length,
      },
    });

    log.info("sent");
    return NextResponse.json({ success: true });
  } catch (error) {
    log.unexpected(error);
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 },
    );
  }
}
