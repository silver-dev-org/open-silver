import { clsx, type ClassValue } from "clsx";
import { SIMILAR_PHRASES } from "./constants";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class PreppingData {
  static readonly cookieName = "prepping-data";
  static readonly tools = {
    "behavioral-checker": "b",
    "take-home-checker": "t",
    "resume-checker": "r",
    "roast-me": "rm",
  };

  static getCookieData() {
    return JSON.parse(
      decodeURIComponent(
        document.cookie
          .split("; ")
          .find((row) => row.startsWith(this.cookieName))
          ?.split("=")[1] || "{}",
      ),
    );
  }

  static getToolData(tool: keyof typeof this.tools) {
    return this.getCookieData()[this.tools[tool]] || {};
  }

  static setToolData(tool: keyof typeof this.tools, value: Object | string) {
    const domain =
      typeof window !== "undefined"
        ? window.location.hostname.replace("open.", "")
        : "localhost";
    const data = this.getCookieData();
    data[this.tools[tool]] = value;
    document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify(data))}; domain=${domain}; path=/; max-age=31536000; samesite=none; secure`;
  }
}

export type VoiceMatch = {
  type: "trigger" | "mispronunciation";
  text: string;
  phrase: string;
};

export function createUtteranceTracker(triggerPhrases: readonly string[]) {
  let text = "";

  const find = (phrases: readonly string[]) => {
    const lowerText = text.toLowerCase();
    return phrases.find((phrase) => lowerText.includes(phrase.toLowerCase()));
  };

  const take = (
    type: VoiceMatch["type"],
    phrase: string | undefined,
  ): VoiceMatch | undefined => {
    const match = phrase ? { type, text: text.trim(), phrase } : undefined;
    text = "";
    return match;
  };

  return {
    get text() {
      return text.trim();
    },
    push(delta: string): VoiceMatch | undefined {
      text += delta;
      const phrase = find(triggerPhrases);
      return phrase ? take("trigger", phrase) : undefined;
    },
    flush(): VoiceMatch | undefined {
      return take("mispronunciation", find(SIMILAR_PHRASES));
    },
  };
}
