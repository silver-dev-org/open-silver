import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
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
