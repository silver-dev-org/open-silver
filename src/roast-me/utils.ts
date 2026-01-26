import { clsx, type ClassValue } from "clsx";
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
