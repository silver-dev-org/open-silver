"use server";

import { dashboardCookieValue } from "@/token-tracker/utils";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function isAuthenticated(): Promise<boolean> {
  const expected = dashboardCookieValue();
  if (!expected) return false;
  const cookieStore = await cookies();
  const value = cookieStore.get("dashboard-auth")?.value ?? "";
  return timingSafeEqual(value, expected);
}

export async function verifyDashboardPassword(formData: FormData) {
  const submitted = (formData.get("password") as string | null) ?? "";
  const expected = process.env.DASHBOARD_PASSWORD ?? "";

  const isMatch =
    expected.length > 0 && timingSafeEqual(submitted, expected);

  if (isMatch) {
    const cookieStore = await cookies();
    cookieStore.set("dashboard-auth", dashboardCookieValue(), {
      httpOnly: true,
      sameSite: "strict",
      path: "/token-tracker/dashboard",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });
    redirect("/token-tracker/dashboard");
  }

  redirect("/token-tracker/dashboard?error=1");
}
