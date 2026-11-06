import {
  GatewayAIClient,
  InvalidModelResponseError,
} from "@/behavioral-checker/client-assistance/infrastructure/gateway-ai-client";
import { GatewaySTTClient } from "@/behavioral-checker/client-assistance/infrastructure/gateway-stt-client";
import {
  CONSULT_MODEL,
  TRANSCRIPTION_MODEL,
} from "@/behavioral-checker/constants";
import {
  experimental_transcribe,
  generateText,
  NoObjectGeneratedError,
  type FinishReason,
} from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: vi.fn(),
  experimental_transcribe: vi.fn(),
}));

afterEach(() => vi.resetAllMocks());

function noObject(finishReason: FinishReason) {
  return new NoObjectGeneratedError({
    response: {} as never,
    usage: {} as never,
    finishReason,
  });
}

describe("GatewaySTTClient", () => {
  it("sends the recording bytes to Whisper through the gateway in English", async () => {
    const audioPath = path.join(os.tmpdir(), `stt-${Date.now()}.webm`);
    await fs.writeFile(audioPath, "webm-bytes");
    vi.mocked(experimental_transcribe).mockResolvedValueOnce({
      text: "my answer",
    } as never);

    const text = await new GatewaySTTClient().transcribeAudio(audioPath);

    expect(text).toBe("my answer");
    const call = vi.mocked(experimental_transcribe).mock.calls[0][0];
    expect(call.model).toMatchObject({ modelId: TRANSCRIPTION_MODEL });
    expect(Buffer.from(call.audio as Uint8Array).toString()).toBe("webm-bytes");
    expect(call.providerOptions).toEqual({ openai: { language: "en" } });
    expect(call.abortSignal).toBeInstanceOf(AbortSignal);
    await fs.unlink(audioPath);
  });

  it("refuses to read audio outside the upload directory", async () => {
    await expect(
      new GatewaySTTClient().transcribeAudio("../../etc/passwd"),
    ).rejects.toThrow("Audio file must be inside the upload directory");
    expect(experimental_transcribe).not.toHaveBeenCalled();
  });
});

describe("GatewayAIClient", () => {
  const consult = () =>
    new GatewayAIClient().consult("about-yourself", "Q?", "A.", []);

  it("returns the model verdict with the question context", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      output: { redFlags: [], greenFlags: ["Clear"], result: "Yes" },
    } as never);

    await expect(consult()).resolves.toEqual({
      redFlags: [],
      greenFlags: ["Clear"],
      result: "Yes",
      question: "Q?",
      questionId: "about-yourself",
      response: "A.",
    });
    expect(vi.mocked(generateText).mock.calls[0][0]).toMatchObject({
      model: CONSULT_MODEL,
      maxOutputTokens: 1000,
    });
  });

  it("sends a prompt the AI SDK accepts, with the answer as the user turn", async () => {
    const { generateText: realGenerateText } =
      await vi.importActual<typeof import("ai")>("ai");
    const model = new MockLanguageModelV4({
      doGenerate: {
        content: [{ type: "text", text: '{"redFlags":[],"greenFlags":[],"result":"No"}' }],
        finishReason: { unified: "stop", raw: "stop" },
        usage: {
          inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 1, text: 1, reasoning: 0 },
        },
        warnings: [],
      },
    });
    vi.mocked(generateText).mockImplementationOnce((options) =>
      realGenerateText({ ...options, model } as never)
    );

    await expect(consult()).resolves.toMatchObject({ result: "No" });
    const [system, user] = model.doGenerateCalls[0].prompt;
    expect(system.role).toBe("system");
    expect(user).toMatchObject({ role: "user" });
    expect(JSON.stringify(user.content)).toContain("A.");
  });

  it.each([
    ["length", "Model response truncated at max_tokens"],
    ["stop", "Model response is not valid JSON"],
  ] as const)(
    "maps an unparseable %s response to InvalidModelResponseError",
    async (finishReason, message) => {
      vi.mocked(generateText).mockRejectedValueOnce(noObject(finishReason));

      await expect(consult()).rejects.toEqual(
        new InvalidModelResponseError(message),
      );
    },
  );

  it("rejects a verdict without a result", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      output: { redFlags: [] },
    } as never);

    await expect(consult()).rejects.toBeInstanceOf(InvalidModelResponseError);
  });

  it("lets gateway errors through for the route to log", async () => {
    const error = new Error("budget exceeded");
    vi.mocked(generateText).mockRejectedValueOnce(error);

    await expect(consult()).rejects.toBe(error);
  });
});
