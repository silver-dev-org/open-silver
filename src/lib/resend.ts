import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend() {
  const key = process.env.RESEND_KEY;
  if (!key) return null;
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}
