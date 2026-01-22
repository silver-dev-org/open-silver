import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import type { ShareRequest, ShareResponse, RoastMetadata } from "@/roast-me/types";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req: NextRequest) {
  try {
    const { snapshot, analysis, isUnhinged }: ShareRequest = await req.json();

    const id = crypto.randomUUID();

    const base64Data = snapshot.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const snapshotBlob = await put(`roast-me/${id}/snapshot.jpg`, buffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    const metadata: RoastMetadata = {
      snapshotUrl: snapshotBlob.url,
      analysis,
      isUnhinged,
      createdAt: new Date().toISOString(),
    };

    await put(`roast-me/${id}/metadata.json`, JSON.stringify(metadata), {
      access: "public",
      contentType: "application/json",
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "anonymous",
      event: "roast_me_api_share_created",
      properties: {
        mode: isUnhinged ? "unhinged" : "standard",
        roast_id: id,
        score: analysis.score,
        green_flags_count: analysis.flags.green.length,
        yellow_flags_count: analysis.flags.yellow.length,
        red_flags_count: analysis.flags.red.length,
      },
    });

    return NextResponse.json({ id } satisfies ShareResponse);
  } catch (error) {
    console.error("Error saving roast:", error);
    return NextResponse.json(
      { error: "Failed to save roast" },
      { status: 500 }
    );
  }
}
