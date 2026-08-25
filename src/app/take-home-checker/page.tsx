import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import TakeHomeCheckerClient from "./client";
import { cookieName } from "@/takehome-checker/constants";

export const metadata: Metadata = pageMetadata({
  title: "Take-home Checker: Instant Project Feedback",
  description:
    "Upload your take-home project and get instant, detailed feedback on code quality and structure to improve your technical interview performance.",
  path: "/take-home-checker",
  ogTitle: "Take-home Checker • Open Silver",
  ogDescription:
    "Upload your take-home project and get instant feedback to improve your technical interview performance.",
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ installation_id?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(cookieName);
  const installationId = params.installation_id || cookie?.value;
  return <TakeHomeCheckerClient installationId={installationId} />;
}
