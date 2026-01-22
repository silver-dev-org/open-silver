"use client";

import { MessageBox } from "./message-box";
import { CameraStatus, SetupAnalysis } from "../types";
import { DeepPartial } from "ai";
import { FlagList } from "./flag-list";
import { BouncingDots } from "./bouncing-dots";
import Link from "next/link";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { ExternalLink } from "lucide-react";

const MESSAGE_DELAY = 1000;

interface MessageChatProps {
  cameraStatus: CameraStatus;
  isUnhinged?: boolean;
  onRoast?: () => void;
  data?: DeepPartial<SetupAnalysis>;
  showResults?: boolean;
  static?: boolean;
  mispronunciation?: {
    detectedPhrase: string;
    attemptCount: number;
  } | null;
  showMutedWarning?: boolean;
}

const getMispronunciationMessage = (
  detectedPhrase: string,
  attemptCount: number,
) => {
  if (attemptCount === 1) {
    return {
      text: `Did you say "${detectedPhrase}"? That's not quite right. It's "roast me".`,
      linkText: 'Learn how to say "Roast" properly',
      linkUrl: "https://dictionary.cambridge.org/pronunciation/english/roast",
    };
  }
  if (attemptCount === 2) {
    return {
      text: `Hmm, not there yet. I understood "${detectedPhrase}". The correct phonetics are /rəʊst/ /miː/.`,
      linkText: "Consider improving your pronunciation with a coach",
      linkUrl: "https://silver.dev/english",
    };
  }
  if (attemptCount === 3) {
    return {
      text: `Seriously?! "${detectedPhrase}"?!. You know what, I'm tired. Try clicking the "Roast me" button above instead.`,
      linkText: null,
      linkUrl: null,
    };
  }
};

export function MessageChat({
  cameraStatus,
  isUnhinged,
  onRoast,
  data,
  showResults,
  static: isStatic,
  mispronunciation,
  showMutedWarning,
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
      {mispronunciation && cameraStatus === "active" && !isStatic && (
        <>
          {Array.from({ length: mispronunciation.attemptCount }, (_, i) => {
            const attemptNumber = i + 1;
            const msg = getMispronunciationMessage(
              mispronunciation.detectedPhrase,
              attemptNumber,
            );
            if (!msg) return null;
            return (
              <MessageBox key={`mispronunciation-${attemptNumber}`} side="left">
                {msg.text}
                {msg.linkUrl && (
                  <>
                    {" "}
                    <Link
                      href={msg.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                      onClick={() => {
                        posthog.capture("roast_me_pronunciation_link_clicked", {
                          mode: isUnhinged ? "unhinged" : "standard",
                          detected_phrase: mispronunciation.detectedPhrase,
                          attempt_count: attemptNumber,
                          link_type: attemptNumber === 1 ? "google" : "silver",
                        });
                      }}
                    >
                      {msg.linkText}
                      <ExternalLink className="inline size-4 ms-1" />
                    </Link>
                  </>
                )}
              </MessageBox>
            );
          })}
        </>
      )}
      {showMutedWarning && cameraStatus === "active" && !isStatic && (
        <MessageBox side="left">
          You&apos;re muted! Click the microphone icon to unmute.
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
