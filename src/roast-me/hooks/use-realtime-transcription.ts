import { createGateway } from "@ai-sdk/gateway";
import { experimental_streamTranscribe as streamTranscribe } from "ai";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  REALTIME_SAMPLE_RATE,
  REALTIME_TRANSCRIPTION_MODEL,
  REALTIME_TRANSCRIPTION_OPTIONS,
  SIMILAR_PHRASES,
} from "../constants";

export type TranscriptionStatus = "idle" | "connecting" | "listening" | "error";

interface UseRealtimeTranscriptionProps {
  onTriggerPhrase?: (transcript: string) => void;
  onMispronunciation?: (transcript: string, detectedPhrase: string) => void;
  triggerPhrases?: string[];
  enabled?: boolean;
  mode?: "standard" | "unhinged";
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
  const abortRef = useRef<AbortController | null>(null);
  const audioControllerRef =
    useRef<ReadableStreamDefaultController<Uint8Array> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioControllerRef.current) {
      try {
        audioControllerRef.current.close();
      } catch {}
      audioControllerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const convertFloat32ToInt16 = useCallback(
    (float32Array: Float32Array): Int16Array => {
      const int16Array = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return int16Array;
    },
    [],
  );

  const checkForTriggerPhrase = useCallback(
    (text: string) => {
      console.log("Transcription:", text);
      const lowerText = text.toLowerCase();

      // Check for exact match first
      const matchedPhrase = triggerPhrases.find((phrase) =>
        lowerText.includes(phrase.toLowerCase()),
      );

      if (matchedPhrase && onTriggerPhrase) {
        posthog.capture("roast_me_voice_trigger_detected", {
          mode,
          transcript: text,
          matched_phrase: matchedPhrase,
        });

        onTriggerPhrase(text);
        return;
      }

      const similarPhrase = SIMILAR_PHRASES.find((phrase) =>
        lowerText.includes(phrase.toLowerCase()),
      );

      if (similarPhrase && onMispronunciation) {
        onMispronunciation(text, similarPhrase);
      }
    },
    [triggerPhrases, onTriggerPhrase, onMispronunciation, mode],
  );

  const startAudioCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: REALTIME_SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: REALTIME_SAMPLE_RATE });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const audio = new ReadableStream<Uint8Array>({
      start: (controller) => {
        audioControllerRef.current = controller;
      },
      cancel: () => {
        audioControllerRef.current = null;
      },
    });

    processor.onaudioprocess = (e) => {
      const controller = audioControllerRef.current;
      if (!controller || !isListeningRef.current) return;
      const int16Data = convertFloat32ToInt16(e.inputBuffer.getChannelData(0));
      controller.enqueue(new Uint8Array(int16Data.buffer));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    return audio;
  }, [convertFloat32ToInt16]);

  const connect = useCallback(async () => {
    if (!enabled) return;

    cleanup();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      setStatus("connecting");

      const tokenResponse = await fetch("/roast-me/api/realtime-token", {
        method: "POST",
      });
      if (!tokenResponse.ok) {
        throw new Error(
          `Failed to get realtime token: ${await tokenResponse.text()}`,
        );
      }
      const { token } = await tokenResponse.json();

      const audio = await startAudioCapture();
      const result = streamTranscribe({
        model: createGateway({ apiKey: token }).transcriptionModel(
          REALTIME_TRANSCRIPTION_MODEL,
        ),
        audio,
        inputAudioFormat: { type: "audio/pcm", rate: REALTIME_SAMPLE_RATE },
        providerOptions: REALTIME_TRANSCRIPTION_OPTIONS,
        abortSignal: abortController.signal,
      });

      setStatus("listening");
      posthog.capture("roast_me_voice_listening_started", { mode });

      for await (const part of result.fullStream) {
        if (part.type === "transcript-delta") {
          setTranscript((prev) => prev + part.delta);
        } else if (part.type === "transcript-final") {
          setTranscript(part.text);
          checkForTriggerPhrase(part.text);
          setTimeout(() => setTranscript(""), 2000);
        } else if (part.type === "error") {
          throw part.error;
        }
      }
    } catch (error) {
      if (abortController.signal.aborted) return;
      console.warn("Error connecting to realtime transcription:", error);
      posthog.capture("roast_me_voice_connection_error", { mode });
      setStatus("error");
    } finally {
      if (abortRef.current === abortController) cleanup();
    }
  }, [enabled, startAudioCapture, checkForTriggerPhrase, cleanup, mode]);

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
