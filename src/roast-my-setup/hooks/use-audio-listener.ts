"use client";

import { useCallback, useRef, useState } from "react";
import type { AudioListenerStatus } from "../types";

export function useAudioListener({
  onAudioData,
}: {
  onAudioData?: (audioData: Float32Array) => void;
} = {}) {
  const [status, setStatus] = useState<AudioListenerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startListening = useCallback(
    (stream: MediaStream) => {
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Float32Array(analyser.frequencyBinCount);

        function processAudio() {
          if (!analyserRef.current) return;

          analyserRef.current.getFloatTimeDomainData(dataArray);

          // Calculate RMS for audio level visualization
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          setAudioLevel(Math.min(1, rms * 10));

          onAudioData?.(dataArray);

          animationFrameRef.current = requestAnimationFrame(processAudio);
        }

        processAudio();
        setStatus("listening");
      } catch (err) {
        setStatus("error");
        if (err instanceof Error) {
          setErrorMessage(err.message);
        }
      }
    },
    [onAudioData]
  );

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setStatus("idle");
    setAudioLevel(0);
  }, []);

  return {
    status,
    errorMessage,
    audioLevel,
    startListening,
    stopListening,
  };
}
