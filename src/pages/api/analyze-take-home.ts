import {
  processableFileExtensions,
  prompt,
} from "@/app/take-home-checker/constants";
import { TakeHome } from "@/app/take-home-checker/types";
import { takeHomeToXML } from "@/app/take-home-checker/utils";
import {
  getFileContent,
  getOctokit,
  getReadmeContent,
  getRepoFilePaths,
} from "@/lib/github";
import { extractJsonFromString } from "@/lib/utils";
import AdmZip from "adm-zip";
import formidable from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "octokit";
import OpenAI from "openai";

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
    const repoFullName = fields.name as string | undefined;
    const file = files.file as formidable.File | undefined;

    let takeHome: TakeHome;

    if (installationId && repoFullName) {
      const octokit = await getOctokit(parseInt(installationId));
      const [docs, code] = await Promise.all([
        await getReadmeContent(octokit, repoFullName),
        await getCodebaseFromGithub(octokit, repoFullName),
      ]);
      takeHome = { docs, code };
    } else if (file) {
      const zip = new AdmZip(files.file?.at(0)?.filepath);
      const entries = zip.getEntries();
      const docs = entries
        .find(({ name }) => name === "README.md")
        ?.getData()
        .toString("utf-8");
      const code = entries
        .filter(({ name }) => isProcessableFile(name))
        .map((entry) => ({
          path: entry.entryName,
          content: entry.getData().toString("utf-8"),
        }));
      takeHome = { code, docs };
    } else {
      throw new Error("Either GitHub repo or zip file is required");
    }

    if (!takeHome.code || !takeHome.docs) throw new Error("Repo is empty");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const content = takeHomeToXML(takeHome);
    const response = await openai.chat.completions.create({
      messages: [
        { role: "developer", content: prompt },
        { role: "user", content },
      ],
      model: "gpt-4o-mini",
      max_tokens: 10000,
      temperature: 0.2,
    });
    const analysis = response.choices[0].message.content;

    if (!analysis) throw new Error("LLM did not return response.");

    const pAnalysis = extractJsonFromString(analysis);

    // Uncomment to copy the responses and paste them as examples
    // console.log(" ---------------------------------- ");
    // console.log(JSON.stringify({ takeHome, analysis: pAnalysis }));
    // console.log(" ---------------------------------- ");

    res.status(200).json(pAnalysis);
  } catch (error) {
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Unknown error");
  }
}

async function getCodebaseFromGithub(octokit: Octokit, repoFullName: string) {
  const filePaths = await getRepoFilePaths(octokit, repoFullName);
  return await Promise.all(
    filePaths.filter(isProcessableFile).map(async (path) => ({
      path: path,
      content: await getFileContent(octokit, repoFullName, path),
    }))
  );
}

function isProcessableFile(fileName: string) {
  return processableFileExtensions.some(
    (extension) => fileName.endsWith(`.${extension}`) || fileName === extension
  );
}
