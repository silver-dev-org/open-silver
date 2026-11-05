import {
  MODEL_MAX_RETRIES,
  MODEL_TIMEOUT_MS,
  TRANSCRIPTION_MODEL,
} from "@/behavioral-checker/constants";
import { gateway } from "@ai-sdk/gateway";
import { experimental_transcribe as transcribe } from "ai";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { STTClient } from "../core/domain/STTClient";

export class GatewaySTTClient implements STTClient {
  async transcribeAudio(audioPath: string): Promise<string> {
    const uploadDir = path.resolve(os.tmpdir());
    const resolvedPath = path.resolve(uploadDir, audioPath);
    if (!resolvedPath.startsWith(uploadDir + path.sep)) {
      throw new Error("Audio file must be inside the upload directory");
    }

    const { text } = await transcribe({
      model: gateway.transcription(TRANSCRIPTION_MODEL),
      audio: await fs.readFile(resolvedPath),
      providerOptions: { openai: { language: "en" } },
      maxRetries: MODEL_MAX_RETRIES,
      abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });
    return text;
  }
}
