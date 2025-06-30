import {
  evaluationPrompt,
  processableFileExtensions,
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
import AdmZip from "adm-zip";
import formidable from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "octokit";
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const installationId = fields.installationId as string | undefined;
    const file = files.file as formidable.File | undefined;
    const repoFullName = fields.name as string | undefined;
    let documentation: string | null = null;
    let codebase: string | null = null;

    if (installationId && repoFullName) {
      const octokit = await getOctokit(parseInt(installationId));
      [documentation, codebase] = await Promise.all([
        await getReadmeContent(octokit, repoFullName),
        await getCodebaseFromGithub(octokit, repoFullName),
      ]);
    } else if (file) {
      const zip = new AdmZip(files.file?.at(0)?.filepath);
      codebase = zip
        .getEntries()
        .filter((entry) => {
          if (entry.name === "README.md") {
            documentation = entry.getData().toString("utf-8");
          }
          return processableFileExtensions.some(
            (extension) =>
              entry.name.endsWith(`.${extension}`) || entry.name === extension
          );
        })
        .map((entry) =>
          convertFileToMarkdownItem({
            path: entry.entryName,
            content: entry.getData().toString("utf-8"),
          })
        )
        .join("\n\n");
    } else {
      throw new Error("Either GitHub repo or zip file is required");
    }

    if (!documentation || !codebase) throw new Error("Repo is empty");
    const analysis = await analyzeTakeHome({ documentation, codebase });
    res.status(200).json(analysis);
  } catch (error) {
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Unknown error");
  }
}

async function analyzeTakeHome({
  documentation,
  codebase,
}: {
  documentation: string | null;
  codebase: string | null;
}): Promise<RepoAnalysis> {
  const prompt = evaluationPrompt
    .replace("${code}", codebase ?? "N/A")
    .replace("${docs}", documentation?.replaceAll("`", "\\`") ?? "N/A");
  const rawAnalysis = await callLLM(prompt);
  if (!rawAnalysis) {
    throw new Error("LLM did not return response.");
  }
  return extractJsonFromString(rawAnalysis);
}

async function getCodebaseFromGithub(octokit: Octokit, repoFullName: string) {
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
  const content = fileContents.map(convertFileToMarkdownItem).join("\n\n");
  return content;
}

function convertFileToMarkdownItem(file: {
  path: string;
  content: string;
}): string {
  const content = file.content.slice(0, 1000).replaceAll("`", "\\`");
  const ellipsis = file.content.length > 1000 ? "\n..." : "";
  const extension = file.path.split(".").at(-1) ?? "text";
  const item = `- \`${file.path}\`

\`\`\`${extension}
${content}${ellipsis}
\`\`\``;
  return item;
}
