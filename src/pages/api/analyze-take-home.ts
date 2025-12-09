import { processableFileExtensions } from "@/takehome-checker/constants";
import { analyzeTakeHome } from "@/takehome-checker";
import { TakeHome, TakeHomeCheckerData } from "@/takehome-checker/types";
import {
  getFileContent,
  getOctokit,
  getReadmeContent,
  getRepoFilePaths,
} from "@/lib/github";
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
  res: NextApiResponse,
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
        .find(({ name }) => /readme\.(md|txt)/i.test(name))
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

    if (!takeHome.docs) {
      throw new Error(
        "It's mandatory for your take-home to have a README.md explaining it.",
      );
    }
    if (!takeHome.code) throw new Error("Repo is empty.");

    const analysis = await analyzeTakeHome(takeHome);

    const data = {
      analysis,
      takeHome,
    } as TakeHomeCheckerData;

    // Uncomment to copy the responses and paste them as examples
    // console.log(" ---------------------------------- ");
    // console.log(JSON.stringify(data));
    // console.log(" ---------------------------------- ");

    res.status(200).json(data);
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
    })),
  );
}

function isProcessableFile(fileName: string) {
  return processableFileExtensions.some(
    (extension) => fileName.endsWith(`.${extension}`) || fileName === extension,
  );
}
