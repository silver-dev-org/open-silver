import { Metadata } from "next";
import { cookies } from "next/headers";
import TakeHomeCheckerClient from "./client";
import { cookieName } from "@/takehome-checker/constants";

export const metadata: Metadata = {
  title: "Take-home Checker",
  description:
    "Upload your take-home project and get instant feedback to improve your technical interview performance.",
  openGraph: {
    title: "Take-home Checker",
    siteName: "Open Silver",
    description:
      "Upload your take-home and get instant feedback on the project.",
    type: "website",
  },
};

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
