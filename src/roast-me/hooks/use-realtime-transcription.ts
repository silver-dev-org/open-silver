import { createGateway } from "@ai-sdk/gateway";
import { experimental_streamTranscribe as streamTranscribe } from "ai";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  REALTIME_SAMPLE_RATE,
  REALTIME_TRANSCRIPTION_MODEL,
  REALTIME_TRANSCRIPTION_OPTIONS,
  TRANSCRIPT_CLEAR_DELAY_MS,
  UTTERANCE_SILENCE_MS,
} from "../constants";
import { createUtteranceTracker, type VoiceMatch } from "../utils";

export type TranscriptionStatus = "idle" | "connecting" | "listening" | "error";

interface UseRealtimeTranscriptionProps {
  onTriggerPhrase?: (transcript: string) => void;
  onMispronunciation?: (transcript: string, detectedPhrase: string) => void;
  triggerPhrases?: string[];
  enabled?: boolean;
  mode?: "standard" | "unhinged";
}

function convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

async function startAudioCapture(isListening: () => boolean) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: REALTIME_SAMPLE_RATE,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
  const audioContext = new AudioContext({ sampleRate: REALTIME_SAMPLE_RATE });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const audio = new ReadableStream<Uint8Array>({
    start: (c) => {
      controller = c;
    },
    cancel: () => {
      controller = null;
    },
  });

  processor.onaudioprocess = (e) => {
    if (!controller || !isListening()) return;
    const int16Data = convertFloat32ToInt16(e.inputBuffer.getChannelData(0));
    controller.enqueue(new Uint8Array(int16Data.buffer));
  };
  source.connect(processor);
  processor.connect(audioContext.destination);

  const stop = () => {
    processor.disconnect();
    source.disconnect();
    audioContext.close();
    try {
      controller?.close();
    } catch {}
    controller = null;
    stream.getTracks().forEach((track) => track.stop());
  };

  return { audio, stop };
}

export function useRealtimeTranscription({
  onTriggerPhrase,
  onMispronunciation,
  triggerPhrases = ["roast me"],
  enabled = true,
  mode = "standard",
}: UseRealtimeTranscriptionProps = {}) {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(true);
  const isListeningRef = useRef<boolean>(true);
  const sessionRef = useRef<AbortController | null>(null);
  const latest = useRef({ onTriggerPhrase, onMispronunciation, triggerPhrases, mode });
  latest.current = { onTriggerPhrase, onMispronunciation, triggerPhrases, mode };

  const cleanup = useCallback(() => {
    sessionRef.current?.abort();
    sessionRef.current = null;
  }, []);

  const handleMatch = useCallback((match: VoiceMatch) => {
    const { onTriggerPhrase, onMispronunciation, mode } = latest.current;
    if (match.type === "trigger") {
      posthog.capture("roast_me_voice_trigger_detected", {
        mode,
        transcript: match.text,
        matched_phrase: match.phrase,
      });
      onTriggerPhrase?.(match.text);
    } else {
      onMispronunciation?.(match.text, match.phrase);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!enabled) return;

    cleanup();
    const session = new AbortController();
    sessionRef.current = session;
    const { signal } = session;
    const tracker = createUtteranceTracker(latest.current.triggerPhrases);
    let silenceTimer: ReturnType<typeof setTimeout> | undefined;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    let stopAudio: (() => void) | undefined;

    const showTranscript = (text: string, clearAfterMs?: number) => {
      clearTimeout(clearTimer);
      setTranscript(text);
      if (clearAfterMs != null) {
        clearTimer = setTimeout(() => setTranscript(""), clearAfterMs);
      }
    };

    const endUtterance = () => {
      const text = tracker.text;
      const match = tracker.flush();
      if (match) handleMatch(match);
      if (text) showTranscript(text, TRANSCRIPT_CLEAR_DELAY_MS);
    };

    signal.addEventListener("abort", () => {
      clearTimeout(silenceTimer);
      clearTimeout(clearTimer);
      stopAudio?.();
    });

    try {
      setStatus("connecting");

      const tokenResponse = await fetch("/roast-me/api/realtime-token", {
        method: "POST",
        signal,
      });
      if (!tokenResponse.ok) {
        throw new Error(
          `Failed to get realtime token: ${await tokenResponse.text()}`,
        );
      }
      const { token } = await tokenResponse.json();

      const { audio, stop } = await startAudioCapture(
        () => isListeningRef.current,
      );
      stopAudio = stop;
      if (signal.aborted) return stop();

      const result = streamTranscribe({
        model: createGateway({ apiKey: token }).transcriptionModel(
          REALTIME_TRANSCRIPTION_MODEL,
        ),
        audio,
        inputAudioFormat: { type: "audio/pcm", rate: REALTIME_SAMPLE_RATE },
        providerOptions: REALTIME_TRANSCRIPTION_OPTIONS,
        abortSignal: signal,
      });

      setStatus("listening");
      posthog.capture("roast_me_voice_listening_started", {
        mode: latest.current.mode,
      });

      for await (const part of result.fullStream) {
        if (part.type === "transcript-delta") {
          clearTimeout(silenceTimer);
          const match = tracker.push(part.delta);
          if (match) {
            showTranscript(match.text, TRANSCRIPT_CLEAR_DELAY_MS);
            handleMatch(match);
          } else {
            showTranscript(tracker.text);
            silenceTimer = setTimeout(endUtterance, UTTERANCE_SILENCE_MS);
          }
        } else if (part.type === "error") {
          throw part.error;
        }
      }
      throw new Error("Realtime transcription stream ended");
    } catch (error) {
      if (signal.aborted) return;
      console.warn("Realtime transcription failed:", error);
      posthog.capture("roast_me_voice_connection_error", {
        mode: latest.current.mode,
      });
      setStatus("error");
    } finally {
      if (sessionRef.current === session) cleanup();
    }
  }, [enabled, cleanup, handleMatch]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [enabled]);

  const toggleListening = useCallback(() => {
    setIsListening((prev) => {
      const newValue = !prev;
      isListeningRef.current = newValue;
      return newValue;
    });
  }, []);

  return {
    status,
    transcript,
    isListening,
    toggleListening,
    reconnect: connect,
  };
}
