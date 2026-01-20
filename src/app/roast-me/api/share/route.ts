import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import type { ShareRequest, ShareResponse, RoastMetadata } from "@/roast-me/types";

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

    return NextResponse.json({ id } satisfies ShareResponse);
  } catch (error) {
    console.error("Error saving roast:", error);
    return NextResponse.json(
      { error: "Failed to save roast" },
      { status: 500 }
    );
  }
}
