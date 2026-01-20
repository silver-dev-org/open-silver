"use client";

import { MessageBox } from "./message-box";
import { CameraStatus, SetupAnalysis } from "../types";
import { DeepPartial } from "ai";
import { FlagList } from "./flag-list";
import { BouncingDots } from "./bouncing-dots";
import Link from "next/link";
import { useEffect, useState } from "react";

const MESSAGE_DELAY = 1000;

interface MessageChatProps {
  cameraStatus: CameraStatus;
  isUnhinged?: boolean;
  onRoast?: () => void;
  data?: DeepPartial<SetupAnalysis>;
  showResults?: boolean;
  static?: boolean;
}

export function MessageChat({
  cameraStatus,
  isUnhinged,
  onRoast,
  data,
  showResults,
  static: isStatic,
}: MessageChatProps) {
  const [visibleMessages, setVisibleMessages] = useState(isStatic ? 3 : 0);

  useEffect(() => {
    if (isStatic) return;
    if (!showResults || !data) {
      setVisibleMessages(0);
      return;
    }

    setVisibleMessages(1);

    const timer2 = setTimeout(() => setVisibleMessages(2), MESSAGE_DELAY);
    const timer3 = setTimeout(() => setVisibleMessages(3), MESSAGE_DELAY * 2);

    return () => {
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [showResults, data, isStatic]);

  const shouldShowResults = isStatic || showResults;

  return (
    <>
      {(cameraStatus === "active" || cameraStatus === "frozen") && (
        <MessageBox side="left" disabledSound={isStatic}>
          Hey! Say &quot;
          {isStatic ? (
            "Roast me"
          ) : (
            <button
              onClick={onRoast}
              disabled={cameraStatus === "frozen"}
              className="link cursor-pointer"
            >
              Roast me
            </button>
          )}
          &quot; aloud.
        </MessageBox>
      )}
      {(isStatic || cameraStatus === "frozen") && (
        <>
          <MessageBox side="right" disabledSound={isStatic}>
            Roast me
          </MessageBox>
          {!isStatic && !showResults && (
            <MessageBox side="left" disabledSound>
              <BouncingDots />
            </MessageBox>
          )}
          {shouldShowResults && data && (
            <>
              {visibleMessages >= 1 && (
                <MessageBox side="left" disabledSound={isStatic}>
                  {data.flags && (
                    <>
                      <FlagList items={data.flags.green} color="green" />
                      <FlagList items={data.flags.yellow} color="yellow" />
                      <FlagList items={data.flags.red} color="red" />
                    </>
                  )}
                </MessageBox>
              )}
              {visibleMessages >= 2 && data.actionPlanSteps && (
                <MessageBox side="left" disabledSound={isStatic}>
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
              {!isStatic &&
                visibleMessages >= 3 &&
                (isUnhinged ? (
                  <MessageBox side="left" disabledSound={isStatic}>
                    Too much for you? Then go back to the politically correct{" "}
                    <Link className="link" href="/roast-me">
                      Roast Me
                    </Link>
                    .
                  </MessageBox>
                ) : (
                  <MessageBox side="left" disabledSound={isStatic}>
                    Do you think it&apos;s over? Try{" "}
                    <Link className="link" href="/roast-me/unhinged">
                      Roast Me <i>Unhinged</i>
                    </Link>{" "}
                    to get brutally roasted.
                  </MessageBox>
                ))}
            </>
          )}
        </>
      )}
    </>
  );
}
