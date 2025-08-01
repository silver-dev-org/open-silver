import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractJsonFromString(input: string) {
  const match = input.match(/```json\n([\s\S]*?)\n```/);
  if (!match) {
    const fallbackMatch = input.match(/{[\s\S]*}/);
    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0]);
    }
    throw new Error("No valid JSON found in the string.");
  }
  return JSON.parse(match[1]) as Record<string, unknown> | unknown[];
}

export class PreppingData {
  static readonly cookieName = "prepping-data";
  static readonly tools = {
    "behavioral-checker": "b",
    "take-home-checker": "t",
    "resume-checker": "r",
  };

  static getCookieData() {
    return JSON.parse(
      decodeURIComponent(
        document.cookie
          .split("; ")
          .find((row) => row.startsWith(this.cookieName))
          ?.split("=")[1] || "{}"
      )
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
