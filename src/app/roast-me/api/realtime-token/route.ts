import {
  REALTIME_TOKEN_TTL_SECONDS,
  REALTIME_TRANSCRIPTION_MODEL,
} from "@/roast-me/constants";
import { createRouteLog } from "@/lib/route-log";
import { gateway } from "@ai-sdk/gateway";
import { NextResponse } from "next/server";

export async function POST() {
  const log = createRouteLog("/roast-me/api/realtime-token");

  try {
    const { token } = await gateway.experimental_transcription.getToken({
      model: REALTIME_TRANSCRIPTION_MODEL,
      expiresAfterSeconds: REALTIME_TOKEN_TTL_SECONDS,
    });
    log.info("issued");
    return NextResponse.json({ token });
  } catch (error) {
    if (log.gatewayUnavailable(error)) {
      return NextResponse.json(
        { error: "Realtime transcription unavailable" },
        { status: 503 },
      );
    }
    log.unexpected(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
