import { cn } from "@/lib/utils";
import { MessageBox } from "./message-box";
import { AnalyzeSetupResponse, CameraStatus } from "../types";

interface MessageChatProps {
  cameraStatus: CameraStatus;
  isPending: boolean;
  onRoast?: () => void;
  data?: AnalyzeSetupResponse;
}

export function MessageChat({
  cameraStatus,
  isPending,
  onRoast,
  data,
}: MessageChatProps) {
  return (
    <>
      {(cameraStatus === "active" || cameraStatus === "frozen") && (
        <MessageBox side="left">
          Hey! Say &quot;
          <button
            onClick={onRoast}
            disabled={cameraStatus === "frozen"}
            className="link cursor-pointer"
          >
            Roast me
          </button>
          &quot; aloud.
        </MessageBox>
      )}
      {cameraStatus === "frozen" && (
        <>
          <MessageBox side="right">Roast me</MessageBox>
          {isPending && (
            <MessageBox side="left">
              <span className="inline-flex">
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0s" }}
                >
                  .
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                >
                  .
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                >
                  .
                </span>
              </span>
            </MessageBox>
          )}
          {data && (
            <>
              <MessageBox side="left">
                <h2
                  className={cn(
                    "text-2xl font-extrabold my-1.5",
                    data.score === "pass" ? "text-success" : "text-destructive",
                  )}
                >
                  {data.score.toUpperCase()}
                </h2>
                {data.greenFlags.length > 0 && (
                  <ul className="my-1.5 text-success">
                    {data.greenFlags.map((flag, i) => (
                      <li key={i}>+ {flag}</li>
                    ))}
                  </ul>
                )}
                {data.yellowFlags.length > 0 && (
                  <ul className="my-1.5 text-warning">
                    {data.yellowFlags.map((flag, i) => (
                      <li key={i}>~ {flag}</li>
                    ))}
                  </ul>
                )}
                {data.redFlags.length > 0 && (
                  <ul className="my-1.5 text-destructive">
                    {data.redFlags.map((flag, i) => (
                      <li key={i}>- {flag}</li>
                    ))}
                  </ul>
                )}
              </MessageBox>
              {data.actionPlanSteps.length > 0 && (
                <MessageBox side="left">
                  <h2 className="text-2xl font-extrabold my-1.5">
                    Action plan
                  </h2>
                  <ul className="my-1.5 list-decimal pl-6">
                    {data.actionPlanSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </MessageBox>
              )}
            </>
          )}
        </>
      )}
      <div className="mb-3" />
    </>
  );
}
