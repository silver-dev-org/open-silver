import crypto from "crypto";

export function dashboardCookieValue(): string {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return "";
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email).digest("hex");
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}
