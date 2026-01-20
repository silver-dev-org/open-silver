import { Loader2, Mic, MicOff } from "lucide-react";
import type { TranscriptionStatus } from "../hooks/use-realtime-transcription";

interface ListeningOverlayProps {
  status: TranscriptionStatus;
  isListening: boolean;
  onToggle?: () => void;
}

export function ListeningOverlay({
  status,
  isListening,
  onToggle,
}: ListeningOverlayProps) {
  if (status === "idle") return null;

  return (
    <button
      onClick={onToggle}
      disabled={status === "connecting"}
      className="absolute right-8 text-base top-8 flex items-center gap-2 rounded-md bg-black/70 px-3 py-2 font-medium text-white backdrop-blur-sm transition-all hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {status === "connecting" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting...</span>
        </>
      )}

      {status === "listening" && isListening && (
        <>
          <div className="relative flex items-center justify-center">
            <Mic className="h-4 w-4" />
            <div className="absolute h-8 w-8 animate-ping rounded-full bg-success opacity-20" />
          </div>
          <span className="text-success">Listening (click to stop)</span>
        </>
      )}

      {status === "listening" && !isListening && (
        <>
          <MicOff className="h-4 w-4 text-warning" />
          <span className="text-warning">Paused (click to resume)</span>
        </>
      )}

      {status === "error" && (
        <>
          <MicOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Error</span>
        </>
      )}
    </button>
  );
}
