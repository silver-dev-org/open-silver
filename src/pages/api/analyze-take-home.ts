import {
  assignmentCharacterLimit,
  processableFileExtensions,
  repoFileLimit,
  repoTextFilePattern,
  textFileBytes,
} from "@/takehome-checker/constants";
import { analyzeTakeHome } from "@/takehome-checker";
import {
  SubmissionFile,
  TakeHome,
  TakeHomeCheckerData,
} from "@/takehome-checker/types";
import {
  commonRoot,
  contentProblems,
  findReadme,
  isJunk,
} from "@/takehome-checker/utils";
import { getFileContent, getOctokit, getRepoFilePaths } from "@/lib/github";
import { createRouteLog } from "@/lib/route-log";
import AdmZip from "adm-zip";
import formidable from "formidable";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 120,
};

const failureMessage =
  "Something went wrong on our end while analyzing your take-home. Please try again in a few minutes.";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const log = createRouteLog<"parse" | "fetch" | "unzip" | "model">(
    "/api/analyze-take-home",
  );
  let isPrivate: boolean | undefined;
  log.set({ source: undefined, fileCount: undefined, isPrivate });

  try {
    log.phase("parse");
    const form = formidable();
    const [fields, files] = await form.parse(req);

    const installationId = fields.installationId as string | undefined;
    const repoFullName = fields.name as string | undefined;
    const file = files.file as formidable.File | undefined;
    const assignment = fields.assignment?.[0]
      ?.trim()
      .slice(0, assignmentCharacterLimit);

    let takeHome: TakeHome;
    let submissionFiles: SubmissionFile[];
    let texts: Map<string, string>;
    let encrypted: string[] = [];

    if (installationId && repoFullName) {
      log.set({ source: "repo" });
      log.phase("fetch");
      const octokit = await getOctokit(parseInt(installationId));
      const [repoFiles, repo] = await Promise.all([
        getRepoFilePaths(octokit, repoFullName),
        octokit.request(`GET /repos/${repoFullName}`),
      ]);
      isPrivate = repo.data.private;
      log.set({ isPrivate });
      submissionFiles = repoFiles;
      const fetched = await Promise.all(
        repoFiles
          .filter(
            ({ path, size }) =>
              !isJunk(path) &&
              size < textFileBytes &&
              (isProcessableFile(path) || repoTextFilePattern.test(path)),
          )
          .slice(0, repoFileLimit)
          .map(async ({ path }) => ({
            path,
            content: await getFileContent(octokit, repoFullName, path),
          })),
      );
      texts = new Map(fetched.map(({ path, content }) => [path, content]));
      const readmePath = findReadme(
        submissionFiles.filter(({ path }) => !isJunk(path)),
      )?.path;
      takeHome = {
        docs: readmePath && texts.get(readmePath),
        code: fetched.filter(({ path }) => isProcessableFile(path)),
      };
    } else if (file) {
      log.set({ source: "upload" });
      log.phase("unzip");
      const entries = new AdmZip(files.file?.at(0)?.filepath)
        .getEntries()
        .filter((entry) => !entry.isDirectory);
      const manifest = parseManifest(fields.manifest?.[0]);
      const allFiles =
        manifest ??
        entries.map((entry) => ({
          path: entry.entryName,
          size: entry.header.size,
        }));
      const root = commonRoot(
        allFiles
          .map(({ path }) => path)
          .filter((name) => !name.startsWith("__MACOSX/")),
      );
      const relative = (name: string) =>
        name.startsWith(root) ? name.slice(root.length) : name;
      encrypted = entries
        .filter((entry) => entry.header.encrypted)
        .map(({ entryName }) => relative(entryName));
      texts = new Map(
        entries
          .filter(
            (entry) => entry.header.size < 500_000 && !entry.header.encrypted,
          )
          .map((entry) => [
            relative(entry.entryName),
            entry.getData().toString("utf-8"),
          ]),
      );
      submissionFiles = allFiles.map(({ path, size }) => ({
        path: relative(path),
        size,
      }));
      const readmePath = findReadme(submissionFiles)?.path;
      takeHome = {
        docs: readmePath && texts.get(readmePath),
        code: submissionFiles
          .map(({ path }) => path)
          .filter(isProcessableFile)
          .map((path) => ({ path, content: texts.get(path) ?? "" })),
      };
    } else {
      log.warn("missing_submission");
      return res.status(400).send("Either GitHub repo or zip file is required");
    }

    log.set({ fileCount: submissionFiles.length });
    if (!submissionFiles.length) {
      log.info("empty");
      return res.status(400).send("Repo is empty.");
    }
    const problems = contentProblems(
      submissionFiles,
      findReadme(submissionFiles.filter(({ path }) => !isJunk(path)))?.path,
      takeHome.docs,
    );
    if (problems.length) {
      log.info("rejected", {
        problems: problems.map(({ reason }) => reason),
      });
      return res.status(422).json({ problems });
    }

    log.phase("model");
    if (!process.env.AI_GATEWAY_API_KEY) {
      log.misconfigured("AI_GATEWAY_API_KEY");
      return res.status(503).send(failureMessage);
    }

    const analysis = await analyzeTakeHome({
      takeHome,
      files: submissionFiles,
      readText: (path) => texts.get(path),
      assignment,
      isPrivate,
      encrypted,
    });

    const data = {
      analysis,
      takeHome,
    } as TakeHomeCheckerData;

    log.info("analyzed", {
      rubric: analysis.rubric,
      findings: analysis.findings.length,
    });
    res.status(200).json(data);
  } catch (e) {
    if (log.gatewayUnavailable(e)) return res.status(503).send(failureMessage);
    log.unexpected(e);
    res.status(500).send(failureMessage);
  }
}

function parseManifest(value?: string) {
  if (!value) return undefined;
  const manifest = JSON.parse(value) as unknown;
  if (!Array.isArray(manifest)) return undefined;
  return manifest
    .filter(
      (file): file is SubmissionFile =>
        typeof file?.path === "string" && typeof file?.size === "number",
    )
    .slice(0, 50_000);
}

function isProcessableFile(fileName: string) {
  return processableFileExtensions.some(
    (extension) => fileName.endsWith(`.${extension}`) || fileName === extension,
  );
}
