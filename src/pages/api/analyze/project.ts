import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { analyzeRepository } from "@/take-home-checker/lib/analyze";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { Octokit } from "octokit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { repo, owner } = req.body;

  if (!session) return res.status(401).json({ error: "Not Authenticated" });

  if (!repo || !owner) {
    return res
      .status(400)
      .json({ error: "Repository and owner are required." });
  }

  const octokit = new Octokit({
    auth: (session as unknown as { accessToken: string }).accessToken,
  });

  try {
    const analysisResults = await analyzeRepository(owner.login, repo, octokit);
    res.status(200).json(analysisResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch repository contents or analyze the project.",
    });
  }
}
