import { NextResponse } from "next/server";
import { createRouteLog } from "@/lib/route-log";

export async function POST() {
  const log = createRouteLog("/roast-me/api/realtime-token");
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    log.misconfigured("OPENAI_API_KEY");
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  try {
    const sessionConfig = {
      session: {
        type: "transcription",
        audio: {
          input: {
            format: {
              type: "audio/pcm",
              rate: 24000,
            },
            transcription: {
              model: "gpt-4o-transcribe",
              language: "en",
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        },
      },
    };

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionConfig),
      }
    );

    if (!response.ok) {
      log.error("openai_rejected", {
        error: {
          name: "OpenAIError",
          message: await response.text(),
          statusCode: response.status,
        },
      });
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: response.status }
      );
    }

    const data = await response.json();
    log.info("issued");
    return NextResponse.json({ token: data.value });
  } catch (error) {
    log.unexpected(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
