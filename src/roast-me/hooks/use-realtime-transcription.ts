import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";

export type TranscriptionStatus = "idle" | "connecting" | "listening" | "error";

interface UseRealtimeTranscriptionProps {
  onTriggerPhrase?: (transcript: string) => void;
  triggerPhrases?: string[];
  enabled?: boolean;
  mode?: "standard" | "unhinged";
}

export function useRealtimeTranscription({
  onTriggerPhrase,
  triggerPhrases = ["roast me"],
  enabled = true,
  mode = "standard",
}: UseRealtimeTranscriptionProps = {}) {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(true);
  const isListeningRef = useRef<boolean>(true);
  const wsRef = useRef<WebSocket | null>(null);
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
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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
      }
    },
    [triggerPhrases, onTriggerPhrase, mode],
  );

  const setupAudio = useCallback(
    async (ws: WebSocket) => {
      try {
        console.log("Setting up audio stream...");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 24000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        streamRef.current = stream;

        const audioContext = new AudioContext({ sampleRate: 24000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // Use ScriptProcessorNode for audio processing
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          // Only send audio if we're listening and websocket is open
          if (ws.readyState === WebSocket.OPEN && isListeningRef.current) {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16Data = convertFloat32ToInt16(inputData);
            const base64Audio = btoa(
              String.fromCharCode.apply(
                null,
                Array.from(new Uint8Array(int16Data.buffer)),
              ),
            );

            ws.send(
              JSON.stringify({
                type: "input_audio_buffer.append",
                audio: base64Audio,
              }),
            );
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        setStatus("listening");
        posthog.capture("roast_me_voice_listening_started", {
          mode,
        });
        console.log("Audio stream setup complete");
      } catch (error) {
        console.error("Failed to setup audio:", error);
        setStatus("error");
        cleanup();
      }
    },
    [convertFloat32ToInt16, cleanup, mode],
  );

  const connect = useCallback(async () => {
    if (!enabled) return;

    try {
      setStatus("connecting");
      console.log("Getting ephemeral token...");

      // Get ephemeral token
      const tokenResponse = await fetch("/roast-me/api/realtime-token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Failed to get realtime token:", errorText);
        throw new Error("Failed to get realtime token");
      }

      const { token } = await tokenResponse.json();
      console.log("Got ephemeral token, connecting WebSocket...");

      // Connect WebSocket without model parameter for transcription
      const ws = new WebSocket(`wss://api.openai.com/v1/realtime`, [
        "realtime",
        `openai-insecure-api-key.${token}`,
      ]);

      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        // Setup audio after connection is established
        setupAudio(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message:", data.type);

          if (
            data.type === "conversation.item.input_audio_transcription.delta"
          ) {
            setTranscript((prev) => prev + data.delta);
          }

          if (
            data.type ===
            "conversation.item.input_audio_transcription.completed"
          ) {
            const fullTranscript = data.transcript;
            console.log("Transcription completed:", fullTranscript);
            setTranscript(fullTranscript);
            checkForTriggerPhrase(fullTranscript);

            // Reset transcript after checking
            setTimeout(() => setTranscript(""), 2000);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.error("WebSocket readyState:", ws.readyState);
        posthog.capture("roast_me_voice_connection_error", {
          mode,
          ready_state: ws.readyState,
        });
        setStatus("error");
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        cleanup();
      };
    } catch (error) {
      console.error("Error connecting to realtime API:", error);
      setStatus("error");
      cleanup();
    }
  }, [enabled, setupAudio, checkForTriggerPhrase, cleanup]);

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
