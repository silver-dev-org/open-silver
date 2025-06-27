import { getOctokit } from "@/lib/github";
import { Metadata } from "next";
import { cookies } from "next/headers";
import Client from "./client";
import { Repo } from "./types";

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
  const cookie = cookieStore.get("installationId");
  const installationId = params.installation_id || cookie?.value;
  const repos: Repo[] = [];

  if (installationId) {
    try {
      const octokit = await getOctokit(parseInt(installationId));
      const { data } =
        await octokit.rest.apps.listReposAccessibleToInstallation({
          per_page: 100,
        });
      repos.push(...(data.repositories as Repo[]));
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      throw error;
    }
  }

  return <Client repos={repos} installationId={installationId} />;
}
