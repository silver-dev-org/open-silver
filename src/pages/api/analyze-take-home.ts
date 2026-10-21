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
import { APIError } from "@anthropic-ai/sdk";
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

function logTakeHome(
  log: (line: string) => void,
  fields: Record<string, unknown>,
) {
  log(JSON.stringify({ "http.route": "/api/analyze-take-home", ...fields }));
}

function describeError(e: Error) {
  return {
    name: e.name,
    message: e.message,
    statusCode: e instanceof APIError ? e.status : undefined,
  };
}

function isGatewayUnavailable(statusCode: number | undefined) {
  return (
    statusCode === 402 ||
    statusCode === 429 ||
    (statusCode !== undefined && statusCode >= 500)
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startedAt = Date.now();
  let source: "repo" | "upload" | undefined;
  let fileCount: number | undefined;
  let isPrivate: boolean | undefined;
  const context = () => ({
    source,
    fileCount,
    isPrivate,
    durationMs: Date.now() - startedAt,
  });

  try {
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
      source = "repo";
      const octokit = await getOctokit(parseInt(installationId));
      const [repoFiles, repo] = await Promise.all([
        getRepoFilePaths(octokit, repoFullName),
        octokit.request(`GET /repos/${repoFullName}`),
      ]);
      isPrivate = repo.data.private;
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
      source = "upload";
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
      logTakeHome(console.warn, {
        outcome: "missing_submission",
        ...context(),
      });
      return res.status(400).send("Either GitHub repo or zip file is required");
    }

    fileCount = submissionFiles.length;
    if (!submissionFiles.length) {
      logTakeHome(console.info, { outcome: "empty", ...context() });
      return res.status(400).send("Repo is empty.");
    }
    const problems = contentProblems(
      submissionFiles,
      findReadme(submissionFiles.filter(({ path }) => !isJunk(path)))?.path,
      takeHome.docs,
    );
    if (problems.length) {
      logTakeHome(console.info, {
        outcome: "rejected",
        ...context(),
        problems: problems.map(({ reason }) => reason),
      });
      return res.status(422).json({ problems });
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      logTakeHome(console.error, {
        outcome: "misconfigured",
        ...context(),
        error: { message: "AI_GATEWAY_API_KEY is not set" },
      });
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

    logTakeHome(console.info, {
      outcome: "analyzed",
      ...context(),
      rubric: analysis.rubric,
      findings: analysis.findings.length,
    });
    res.status(200).json(data);
  } catch (e) {
    if (!(e instanceof Error)) {
      logTakeHome(console.error, { outcome: "error", ...context(), error: e });
      return res.status(500).send(failureMessage);
    }

    if (e instanceof APIError && isGatewayUnavailable(e.status)) {
      logTakeHome(e.status === 402 ? console.warn : console.error, {
        outcome: "gateway_unavailable",
        ...context(),
        error: describeError(e),
      });
      return res.status(503).send(failureMessage);
    }

    logTakeHome(console.error, {
      outcome: "error",
      ...context(),
      error: { ...describeError(e), stack: e.stack },
    });
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
