import { FeedbackRequest } from "@/roast-me/types";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getPostHogClient } from "@/lib/posthog-server";

const resend = new Resend(process.env.RESEND_KEY);

export async function POST(req: NextRequest) {
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

    const { error } = await resend.emails.send({
      from: "Roast Me <feedback@silver.dev>",
      to: ["nicolas@silver.dev"],
      subject: "User feedback",
      attachments: data.snapshot
        ? [{ filename: "analysis.png", content: data.snapshot }]
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending feedback:", error);
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 },
    );
  }
}
