import { cn } from "@/lib/utils";
import { MessageBox } from "./message-box";
import { CameraStatus, SetupAnalysis } from "../types";
import { DeepPartial } from "ai";
import { SCORE_LABELS } from "../constants";
import { FlagList } from "./flag-list";
import { BouncingDots } from "./bouncing-dots";
import Link from "next/link";

interface MessageChatProps {
  cameraStatus: CameraStatus;
  isLoading: boolean;
  isUnleashed?: boolean;
  onRoast?: () => void;
  data?: DeepPartial<SetupAnalysis>;
  showResults?: boolean;
}

export function MessageChat({
  cameraStatus,
  isLoading,
  isUnleashed,
  onRoast,
  data,
  showResults,
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
          {isLoading && !showResults && (
            <MessageBox side="left">
              <BouncingDots />
            </MessageBox>
          )}
          {showResults && data && (
            <>
              <MessageBox side="left">
                {data.flags && (
                  <>
                    <FlagList items={data.flags.green} color="green" />
                    <FlagList items={data.flags.yellow} color="yellow" />
                    <FlagList items={data.flags.red} color="red" />
                  </>
                )}
              </MessageBox>
              {data.actionPlanSteps && (
                <MessageBox side="left">
                  <h2 className="text-2xl font-extrabold my-1.5">
                    Action plan
                  </h2>
                  {data.actionPlanSteps.length > 0 ? (
                    <ul className="my-1.5 list-decimal pl-6">
                      {data.actionPlanSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  ) : (
                    "Nothing required; you're ready!"
                  )}
                </MessageBox>
              )}
              {isUnleashed ? (
                <MessageBox side="left">
                  Too much for you? Then go back to the <s>baby-level</s>{" "}
                  politically correct{" "}
                  <Link className="link" href="/roast-me">
                    Roast Me
                  </Link>
                  .
                </MessageBox>
              ) : (
                <MessageBox side="left">
                  Do you think it&apos;s over? Try{" "}
                  <Link className="link" href="/roast-me/unleashed">
                    Roast Me <i>Unleashed</i>
                  </Link>{" "}
                  to get brutally roasted.
                </MessageBox>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
