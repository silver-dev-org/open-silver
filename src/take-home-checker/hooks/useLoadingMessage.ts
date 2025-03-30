"use client";

import { useEffect, useState } from "react";

const loadingMessages = [
  "Initializing AI thought process...",
  "Activating neural network...",
  "Generating embeddings of the problem...",
  "Simulating a billion test cases...",
  "Performing a recursive self-improvement cycle...",
  "Fine-tuning my model weights...",
  "Verifying output against training data...",
  "Cross-referencing solutions in parallel universes...",
  "Predicting the next optimal code sequence...",
];

const TIME_INTERVAL = 4000;

const useLoadingMessage = (isLoading: boolean) => {
  const [message, setMessage] = useState(
    loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  );

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setMessage(
        loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
      );
    }, TIME_INTERVAL);

    return () => clearInterval(interval);
  }, [isLoading]);

  return message;
};

export default useLoadingMessage;
