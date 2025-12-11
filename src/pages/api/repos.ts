import { GithubRepo } from "@/takehome-checker/types";
import { getOctokit } from "@/lib/github";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const repos = await getRepos(req.body.installationId);
    res.status(200).json(repos);
  } catch (error) {
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Unknown error");
  }
}

async function getRepos(installationId: number) {
  const octokit = await getOctokit(installationId);
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });
  return data.repositories as GithubRepo[];
}
