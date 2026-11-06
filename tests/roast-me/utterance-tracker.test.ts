import { createUtteranceTracker } from "@/roast-me/utils";
import { describe, expect, it } from "vitest";

const push = (
  tracker: ReturnType<typeof createUtteranceTracker>,
  deltas: string[],
) => deltas.map((delta) => tracker.push(delta)).filter(Boolean);

describe("createUtteranceTracker", () => {
  it("fires the trigger as soon as the phrase streams in, without a final transcript", () => {
    const tracker = createUtteranceTracker(["roast me"]);

    expect(push(tracker, [" Roast"])).toEqual([]);
    expect(tracker.push(" me")).toEqual({
      type: "trigger",
      text: "Roast me",
      phrase: "roast me",
    });
    expect(tracker.text).toBe("");
  });

  it("detects every attempt in one long stream", () => {
    const tracker = createUtteranceTracker(["roast me"]);

    const matches = push(tracker, [
      " Roast", " me", ".",
      " Hello", ",", " can", " you", " hear", " me", "?",
    ]);
    tracker.flush();
    matches.push(...push(tracker, [" Roast", " me", " please"]));

    expect(matches.map((m) => m?.type)).toEqual(["trigger", "trigger"]);
  });

  it("reports a mispronunciation only once the utterance ends", () => {
    const tracker = createUtteranceTracker(["roast me"]);

    expect(push(tracker, [" Ghost", " me", "."])).toEqual([]);
    expect(tracker.flush()).toEqual({
      type: "mispronunciation",
      text: "Ghost me.",
      phrase: "ghost",
    });
  });

  it("does not flag a partial 'roast' that becomes the trigger", () => {
    const tracker = createUtteranceTracker(["roast me"]);

    push(tracker, [" Roast", " me"]);

    expect(tracker.flush()).toBeUndefined();
  });

  it("ignores unrelated speech", () => {
    const tracker = createUtteranceTracker(["roast me"]);

    push(tracker, [" Hello", ",", " can", " you", " hear", " me", "?"]);

    expect(tracker.flush()).toBeUndefined();
  });
});
