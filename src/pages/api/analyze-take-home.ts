import {
  processableFileExtensions,
  takeHomeEvaluationPrompt,
} from "@/app/take-home-checker/constants";
import { RepoAnalysis } from "@/app/take-home-checker/types";
import {
  getFileContent,
  getOctokit,
  getReadmeContent,
  getRepoFiles,
} from "@/lib/github";
import { callLLM } from "@/lib/openai";
import { extractJsonFromString } from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "octokit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const analysis = await analyzeTakeHome(req.body);
    res.status(200).json(analysis);
  } catch (error) {
    console.error("Error analyzing take-home:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function analyzeTakeHome({
  installationId,
  repoFullName,
}: {
  installationId: number;
  repoFullName: string;
}): Promise<RepoAnalysis> {
  const octokit = await getOctokit(installationId);
  const [readme, code] = await Promise.all([
    await getReadmeContent(octokit, repoFullName),
    await getCodebase(octokit, repoFullName),
  ]);
  const prompt = takeHomeEvaluationPrompt
    .replace("${code}", code ?? "N/A")
    .replace("${docs}", readme?.replaceAll("`", "\\`") ?? "N/A");
  const rawAnalysis = await callLLM(prompt);
  if (!rawAnalysis) {
    throw new Error("LLM did not return response.");
  }
  return extractJsonFromString(rawAnalysis);
}

async function getCodebase(octokit: Octokit, repoFullName: string) {
  const files = await getRepoFiles(octokit, repoFullName);
  const relevantFiles = files.filter((file) =>
    processableFileExtensions.some(
      (extension) => file.endsWith(`.${extension}`) || file === extension
    )
  );
  const fileContents = await Promise.all(
    relevantFiles.map(async (file) => ({
      path: file,
      content: await getFileContent(octokit, repoFullName, file),
    }))
  );
  const content = fileContents
    .map((file) => {
      const content = file.content.slice(0, 1000).replaceAll("`", "\\`");
      const ellipsis = file.content.length > 1000 ? "\n..." : "";
      const extension = file.path.split(".").at(-1) ?? "text";
      const item = `- \`${file.path}\`

\`\`\`${extension}
${content}${ellipsis}
\`\`\``;
      return item;
    })
    .join("\n\n");
  return content;
}
