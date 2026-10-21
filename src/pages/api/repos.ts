import { GithubRepo } from "@/takehome-checker/types";
import { getOctokit } from "@/lib/github";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouteLog } from "@/lib/route-log";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const log = createRouteLog("/api/repos");
  try {
    const repos = await getRepos(req.body.installationId);
    log.info("listed", { repoCount: repos.length });
    res.status(200).json(repos);
  } catch (error) {
    log.unexpected(error);
    res.status(500).send("Could not list your repositories.");
  }
}

async function getRepos(installationId: number) {
  const octokit = await getOctokit(installationId);
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });
  return data.repositories as GithubRepo[];
}
