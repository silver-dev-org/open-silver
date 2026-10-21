import { unzipSync, zipSync } from "fflate";
import {
  aiLeftoverPatterns,
  aiToolPaths,
  docCredentialPattern,
  binaryFilePattern,
  blockingFileBytes,
  blockingFolderBytes,
  credentialKeyPattern,
  criteria,
  dataFilePattern,
  envConfigPattern,
  envExamplePattern,
  envReadPattern,
  evidenceLimit,
  findingLimits,
  ignoredEnvVars,
  scaffoldedAgentFile,
  testFilePattern,
  heavyFileBytes,
  archiveFilePattern,
  imageFilePattern,
  videoFilePattern,
  junkDirectories,
  nonBaseCodePattern,
  noRedFlags,
  strongNoRedFlags,
  optionalEnvCommentPattern,
  optionalEnvPattern,
  placeholderValuePattern,
  selfChosenSecretPattern,
  providerSecretPatterns,
  frameworkReadmePattern,
  generatedNamePattern,
  silverMention,
  processableFileExtensions,
  readmeMinCharacters,
  textFileBytes,
  uploadBytes,
  yesYellowFlags,
} from "./constants";
import {
  Codebase,
  Color,
  Evidence,
  FastReject,
  Finding,
  Rubric,
  Score,
  Submission,
  SubmissionFile,
  TakeHome,
  TakeHomeAnalysis,
} from "./types";

export function takeHomeToXML(takeHome: TakeHome, codeTruncation?: number) {
  return `<take-home>
<docs>
${takeHome.docs ?? "N/A"}
</docs>
<code>
${codebaseToString(takeHome.code, codeTruncation)}
</code>
</take-home>
`;
}

export function codebaseToString(code?: Codebase, truncation: number = 1000) {
  if (!code) return "N/A";
  return code
    .map(
      (file) => `File: ${file.path}
---
${
  truncation && truncation > 0
    ? file.content.slice(0, truncation) +
      (file.content.length > truncation ? "\n<content-truncated />" : "")
    : file.content
}
---
`
    )
    .join("\n");
}

export function findReadme(files: SubmissionFile[]) {
  const markdown = files.filter(({ path }) => /\.(md|txt|rst)$/i.test(path));
  const depth = (path: string) => path.split("/").length;
  const byDepth = (a: SubmissionFile, b: SubmissionFile) =>
    depth(a.path) - depth(b.path);
  return (
    markdown.filter(({ path }) => /readme/i.test(basename(path))).sort(byDepth)[0] ??
    markdown
      .filter(({ path }) => depth(path) === 1 && !/license|changelog/i.test(path))
      .sort((a, b) => b.size - a.size)[0]
  );
}

export function criteriaFor(rubric?: Rubric) {
  return Object.entries(criteria).flatMap(([id, criterion]) => {
    const color = (rubric && criterion.severity[rubric]) ?? criterion.severity["*"];
    return color && color !== "off" ? [{ id, criterion, color }] : [];
  });
}

export function runCodeChecks(
  submission: Submission,
  readText: (path: string) => string | undefined,
  context: { isPrivate?: boolean; encrypted?: string[] } = {},
): Evidence[] {
  const { files, readme, readmePath } = submission;
  const paths = files.map(({ path }) => path);
  const own = paths.filter((path) => !isJunk(path));
  const evidence: Evidence[] = [];
  const add = (id: string, file: string | undefined, snippet?: string) =>
    evidence.push({ id, file, snippet });

  for (const [name, pattern] of providerSecretPatterns) {
    for (const path of paths.filter(isScannable)) {
      const text = readText(path);
      if (text?.includes("\u0000")) continue;
      const line = text
        ?.split("\n")
        .find((line) => pattern.test(line) && !isPlaceholder(line));
      if (!line) continue;
      evidence.push({ id: "SECRETS", note: name, file: path, snippet: mask(line.trim()) });
      break;
    }
  }

  own
    .filter((path) => /\.(md|txt|rst)$/i.test(path) && !/requirements/i.test(path))
    .flatMap((path) => {
      const line = readText(path)?.split("\n").find((line) => docCredentialPattern.test(line) && !isPlaceholder(line));
      return line ? [{ id: "SECRETS", note: "Credential in the documentation", file: path, snippet: mask(line.trim()) }] : [];
    })
    .slice(0, 3)
    .forEach((item) => evidence.push(item));

  own
    .filter((path) => isScannable(path) && !/(^|\/)\.gitignore$/.test(path))
    .flatMap((path) => {
      const line = readText(path)?.split("\n").find((line) => silverMention.test(line.replace(generatedNamePattern, "")));
      return line ? [{ id: "SILVER_REFERENCE", file: path, snippet: line.trim().slice(0, 160) }] : [];
    })
    .slice(0, 3)
    .forEach((item) => evidence.push(item));

  shippedDependencies(paths).slice(0, 5).forEach((dir) => add("DEPENDENCIES_SHIPPED", dir));

  if (!readme) add("README", undefined);

  own
    .filter((path) => /(^|\/)\.env(\.[a-z]+)?$/i.test(path) && !/example|sample|template/i.test(path))
    .forEach((path) => {
      const line = readText(path)
        ?.split("\n")
        .find((line) => {
          const value = line.match(credentialKeyPattern)?.[3];
          if (!value || isPlaceholder(line)) return false;
          const url = value.match(/^[a-z+]+:\/\/[^:@\s]+:([^@\s]+)@([^/:\s]+)/i);
          if (url) return !/^(localhost|127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal|db|postgres|mysql|mongo|redis)$/i.test(url[2]) && url[1].length >= 8;
          return value.length >= 20 && /[a-z]/i.test(value) && /\d/.test(value) && !/^(test|dev|local|dummy|fake|example|sample|changeme)/i.test(value);
        });
      if (line) evidence.push({ id: "ENV_FILE", file: path, snippet: mask(line.trim()) });
    });

  own
    .filter((path) => aiToolPaths.test(path) && !scaffoldedAgentFile.test(readText(path) ?? ""))
    .slice(0, 3)
    .forEach((path) => add("AI_TOOL_CONFIG", path));

  paths
    .filter((path) => /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)/.test(path))
    .slice(0, 3)
    .forEach((path) => add("OS_JUNK", path));

  heavyFiles(files)
    .slice(0, 3)
    .forEach(({ path, size }) => evidence.push({ id: "HEAVY_FILES", file: path, note: `${(size / 1e6).toFixed(1)} MB` }));

  context.encrypted?.slice(0, 3).forEach((path) => add("PASSWORD_PROTECTED", path));
  if (context.isPrivate) add("REPO_ACCESSIBLE", undefined);

  const dockerFiles = own.filter((path) => /(^|\/)(Dockerfile[^/]*|(docker-)?compose\.ya?ml)$/i.test(path));
  const topLevelDocs = own.filter((path) => !path.includes("/") && /\.md$/i.test(path)).map((path) => readText(path) ?? "");
  if (!dockerFiles.length) add("DOCKER", undefined);
  else if (
    ![readme ?? "", ...topLevelDocs].some((text) => /docker/i.test(text)) &&
    ![...(readme ?? "").matchAll(/\bmake\s+([\w.-]+)/g)].some(([, target]) =>
      own.some((path) => /(^|\/)Makefile$/.test(path) && /docker[- ]compose\b.*\bup\b|docker run\b/.test(makeRecipe(readText(path) ?? "", target))),
    )
  )
    add("DOCKER_IN_README", dockerFiles[0]);

  if (!own.some((path) => testFilePattern.test(path))) add("TESTS", undefined);

  const envReads = own.filter(isScannable).flatMap((path) => {
    const text = readText(path);
    if (!text || text.includes("\u0000")) return [];
    return [...text.matchAll(envReadPattern)].flatMap((match) => {
      const name = match.slice(1).find(Boolean);
      return name && !ignoredEnvVars.includes(name) ? [{ name, path, line: lineOf(text, match.index) }] : [];
    });
  });
  const hasEnvExample = own.some((path) => envExamplePattern.test(path));
  const configText = [readme ?? "", ...own.filter((path) => envConfigPattern.test(path)).map((path) => readText(path) ?? "")].join("\n");
  const documented = envReads.some(({ name }) => configText.includes(name));
  if (envReads.length && !hasEnvExample && !documented)
    evidence.push({ id: "CONFIG_EXAMPLE", note: `Reads ${[...new Set(envReads.map(({ name }) => name))].slice(0, 5).join(", ")}`, file: envReads[0].path, snippet: envReads[0].line });

  own
    .filter((path) => envExamplePattern.test(path))
    .flatMap((path) =>
      (readText(path) ?? "").split("\n").flatMap((line, index, lines) => {
        const [, name, value] = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/) ?? [];
        const bare = value?.replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
        const needsValue = selfChosenSecretPattern.test(name) ? bare === "" && !/PASSWORD/i.test(name) : placeholderValuePattern.test(bare ?? "");
        const hasFallback = envReads.some((read) => read.name === name && new RegExp(`${name}\\W{0,4}(\\?\\?|\\|\\||,)`).test(read.line));
        const documentedOptional = (readme ?? "").split("\n").some((text) => text.includes(name) && /optional|by default|not set|defaults? to|without|unused|required (only )?when|only (when|if)\b/i.test(text));
        const paragraphStart = lines.slice(0, index).findLastIndex((text) => !text.trim()) + 1;
        const header = lines.slice(0, lines.findIndex((text) => !text.trim().startsWith("#")));
        const commentedOptional = [...header, ...lines.slice(paragraphStart, index)].some((text) => text.trim().startsWith("#") && optionalEnvCommentPattern.test(text));
        return name && bare !== undefined && needsValue && !hasFallback && !documentedOptional && !commentedOptional && !/optional/i.test(line) && !ignoredEnvVars.includes(name) && !optionalEnvPattern.test(name)
          ? [{ id: "SETUP_FRICTION", file: path, snippet: line.trim() }]
          : [];
      }),
    )
    .slice(0, 3)
    .forEach((item) => evidence.push(item));

  if (paths.some((path) => /\.(py|ipynb)$/.test(path))) {
    const manifest = paths.find((path) => /(^|\/)(requirements[^/]*\.txt|pyproject\.toml|Pipfile|environment\.ya?ml)$/.test(path));
    const unpinned = manifest?.endsWith(".txt")
      ? readText(manifest)
          ?.split("\n")
          .find((line) => /^[A-Za-z]/.test(line.trim()) && !/[=<>~]=?/.test(line))
      : undefined;
    if (!manifest) add("PINNED_DEPENDENCIES", undefined);
    else if (unpinned) add("PINNED_DEPENDENCIES", manifest, unpinned.trim());
  }

  if (readme && readmePath) {
    readmeContradictions(readme, own, readText)
      .slice(0, 3)
      .forEach(({ note, line }) => evidence.push({ id: "README_MATCHES_CODE", note, file: readmePath, snippet: line }));

    const base = readmePath.includes("/") ? readmePath.slice(0, readmePath.lastIndexOf("/") + 1) : "";
    const known = new Set(paths.map((path) => path.toLowerCase()));
    const exists = (reference: string) => {
      const target = normalizePath(base + reference).toLowerCase();
      const name = `/${reference.replace(/^(\.\.?\/)+/, "").toLowerCase()}`;
      return (
        known.has(target) ||
        paths.some((path) => {
          const lower = `/${path.toLowerCase()}`;
          return lower.endsWith(name) || lower.startsWith(`/${target}/`);
        })
      );
    };
    referencedFiles(readme)
      .filter((reference) => !exists(reference))
      .slice(0, 3)
      .forEach((reference) => evidence.push({ id: "NOTES_OUTSIDE_SUBMISSION", note: notAtPath(reference, paths), file: readmePath, snippet: readme.split("\n").find((line) => line.includes(reference))?.trim() }));

    if (!/!\[[^\]]*\]\([^)]+\)|<img\s|\.(gif|png|jpe?g|webp|mp4)\b/i.test(readme))
      add("SCREENSHOTS", undefined);


    const leftover = readme.replace(/```[\s\S]*?```/g, "").match(aiLeftoverPatterns);
    if (leftover) add("TEMPLATE_LEFTOVERS", readmePath, leftover[0].trim());

    if (spanishRatio(readme) > 0.04)
      add(
        "ENGLISH_ONLY",
        readmePath,
        readme.split("\n").find((line) => spanishRatio(line) > 0.15)?.trim(),
      );
  }

  return evidence;
}

export function isGrounded(snippet: string, sources: string[]) {
  const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();
  const corpus = sources.map(normalize);
  const lines = snippet.split("\n").map(normalize).filter((line) => line.length > 3);
  return lines.length > 0 && lines.every((line) => corpus.some((source) => source.includes(line)));
}

export function inspectZip(data: Uint8Array) {
  const entries: SubmissionFile[] = [];
  const contents = unzipSync(data, {
    filter: ({ name, originalSize }) => {
      if (name.endsWith("/")) return false;
      entries.push({ path: name, size: originalSize });
      return originalSize < textFileBytes && !isJunk(name) && !binaryFilePattern.test(name);
    },
  });
  const root = commonRoot(entries.map(({ path }) => path).filter((path) => !path.startsWith("__MACOSX/")));
  const relative = (path: string) => (path.startsWith(root) ? path.slice(root.length) : path);
  const files = entries.map(({ path, size }) => ({ path: relative(path), size }));
  const texts = Object.fromEntries(Object.entries(contents).map(([path, content]) => [relative(path), content]));
  const decoder = new TextDecoder();
  const readText = (path: string) => (texts[path] ? decoder.decode(texts[path]) : undefined);
  const readmePath = findReadme(files.filter(({ path }) => !isJunk(path)))?.path;

  const problems: FastReject[] = [
    ...contentProblems(files, readmePath, readmePath && readText(readmePath)),
    ...[...shippedDependencies(files.map(({ path }) => path)), ...cacheFolders(files.map(({ path }) => path))]
      .map((path) => ({
        reason: "dependencies" as const,
        path,
        size: files.filter((file) => file.path.startsWith(`${path}/`)).reduce((sum, file) => sum + file.size, 0),
      }))
      .filter(({ size }) => size >= blockingFolderBytes),
    ...heavyFiles(files)
      .filter(({ path, size }) => size >= blockingFileBytes && !videoFilePattern.test(path) && !imageFilePattern.test(path))
      .map(({ path, size }) => ({ reason: "heavy" as const, path, size })),
  ].slice(0, 10);

  return { files, ...fitUpload(texts, readmePath), problems, readmePath, readText };
}

export function contentProblems(files: SubmissionFile[], readmePath?: string, readme?: string): FastReject[] {
  const own = files.map(({ path }) => path).filter((path) => !isJunk(path));
  const text = (readme ?? "").trim();
  return [
    ...(!readmePath
      ? [{ reason: "no-readme" as const }]
      : text.length < readmeMinCharacters || !text.split("\n").some((line) => line.trim() && !line.trim().startsWith("#"))
        ? [{ reason: "short-readme" as const, path: readmePath }]
        : []),
    ...(own.some((path) => processableFileExtensions.some((extension) => path.endsWith(`.${extension}`)) || /\.(html|ipynb)$/i.test(path))
      ? []
      : [{ reason: "no-source" as const }]),
  ];
}

function fitUpload(texts: Record<string, Uint8Array>, readmePath?: string) {
  const kept = { ...texts };
  const largest = Object.keys(kept)
    .filter((path) => path !== readmePath)
    .sort((a, b) => kept[b].length - kept[a].length);
  const skipped: SubmissionFile[] = [];
  let upload = zipSync(kept);
  while (upload.byteLength > uploadBytes && largest.length) {
    const rawBytes = Object.values(kept).reduce((sum, content) => sum + content.length, 0);
    let excess = ((upload.byteLength - uploadBytes) / upload.byteLength) * rawBytes;
    while (excess > 0 && largest.length) {
      const path = largest.shift()!;
      skipped.push({ path, size: kept[path].length });
      excess -= kept[path].length;
      delete kept[path];
    }
    upload = zipSync(kept);
  }
  return { upload, skipped };
}

export function scoreFor(findings: Finding[]): Score {
  const red = findings.filter(({ color }) => color === "red").length;
  if (red >= strongNoRedFlags) return "Strong no";
  if (red >= noRedFlags) return "No";
  const yellow = findings.filter(({ color }) => color === "yellow").length;
  if (yellow > yesYellowFlags) return "No";
  return yellow === 0 ? "Strong yes" : "Yes";
}

export function isTemplateReadme(readme: string, assignment?: string) {
  if (frameworkReadmePattern.test(readme.split("\n").find((line) => line.trim()) ?? "")) return true;
  const lines = readme.split("\n").map((line) => line.trim()).filter((line) => line.length > 30);
  const normalized = (assignment ?? "").replace(/\s+/g, " ");
  return lines.length >= 5 && lines.filter((line) => normalized.includes(line.replace(/\s+/g, " "))).length / lines.length >= 0.6;
}

export function isBaseCode(path: string) {
  return !isJunk(path) && !testFilePattern.test(path) && !nonBaseCodePattern.test(path);
}

export function commonRoot(paths: string[]) {
  const first = paths[0]?.split("/")[0];
  return paths.length && paths.every((path) => path.startsWith(`${first}/`)) ? `${first}/` : "";
}

export function assembleAnalysis(
  rubric: Rubric | undefined,
  applicable: ReturnType<typeof criteriaFor>,
  evidence: Evidence[],
): TakeHomeAnalysis {
  const found = applicable
    .filter(({ id }) => evidence.some((item) => item.id === id))
    .sort((a, b) => Number(a.criterion.check === "ai") - Number(b.criterion.check === "ai"));
  const findings = (Object.keys(findingLimits) as Color[]).flatMap((level) =>
    found
      .filter(({ color }) => color === level)
      .slice(0, findingLimits[level])
      .map(({ id, criterion, color }) => ({
        id,
        title: criterion.title,
        color,
        feedback: criterion.feedback,
        evidence: evidence
          .filter((item) => item.id === id)
          .slice(0, evidenceLimit)
          .map(({ note, file, snippet }) => ({ note, file, snippet })),
      })),
  );
  return {
    rubric,
    findings,
    passed: applicable.filter(({ id }) => !found.some((finding) => finding.id === id)).map(({ criterion }) => criterion.title),
  };
}

export function shippedDependencies(paths: string[]) {
  return [
    ...new Set(
      paths
        .filter((path) => !path.startsWith("__MACOSX/"))
        .flatMap((path) => {
          const segments = path.split("/").slice(0, -1);
          const index = segments.findIndex((segment) => junkDirectories.includes(segment));
          return index === -1 ? [] : [segments.slice(0, index + 1).join("/")];
        }),
    ),
  ];
}

function cacheFolders(paths: string[]) {
  return [...new Set(paths.filter((path) => !path.startsWith("__MACOSX/")).flatMap((path) => path.match(/^(.*\/)?tmp\/cache(?=\/)/)?.[0] ?? []))];
}

export function heavyFiles(files: SubmissionFile[]) {
  return files.filter(
    ({ path, size }) =>
      !isJunk(path) && !dataFilePattern.test(path) && !/(^|\/)\.yarn\//.test(path) && (size > heavyFileBytes || archiveFilePattern.test(path) || (videoFilePattern.test(path) && size >= blockingFileBytes)),
  );
}

export function isJunk(path: string) {
  const segments = path.split("/");
  return (
    segments[0] === "__MACOSX" ||
    segments.includes(".git") ||
    junkDirectories.some((dir) => segments.includes(dir)) ||
    segments.some((segment, position) => segment === "cache" && segments[position - 1] === "tmp" && position < segments.length - 1)
  );
}

function readmeContradictions(readme: string, paths: string[], readText: (path: string) => string | undefined) {
  const codeText = paths
    .filter((path) => !/\.(md|txt|rst)$/i.test(path) && !binaryFilePattern.test(path))
    .map((path) => readText(path) ?? "")
    .join("\n");
  if (!codeText.trim()) return [];
  const blocks = [...readme.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((match) => match[1]);
  const commandLines = [...blocks.join("\n").split("\n"), ...[...readme.matchAll(/`([^`\n]+)`/g)].map((match) => match[1])];
  const found: { note: string; line?: string }[] = [];

  for (const line of blocks.join("\n").split("\n")) {
    const name = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9]*_[A-Z0-9_]+)\s*=(?!\s*["']?\$)/)?.[1];
    if (name && !codeText.includes(name)) found.push({ note: `${name} isn't read anywhere in the code`, line: line.trim() });
  }

  const scripts = new Set(
    paths
      .filter((path) => /(^|\/)package\.json$/.test(path))
      .flatMap((path) => {
        try {
          return Object.keys((JSON.parse(readText(path) ?? "{}") as { scripts?: object }).scripts ?? {});
        } catch {
          return [];
        }
      }),
  );
  if (scripts.size)
    for (const line of commandLines) {
      const script = line.match(/\b(?:npm run|pnpm run|bun run|yarn run)\s+([\w:.-]+)/)?.[1];
      if (script && !scripts.has(script)) found.push({ note: `"${script}" isn't a script in package.json`, line: line.trim() });
    }

  const makefile = paths.find((path) => /(^|\/)Makefile$/.test(path));
  if (makefile)
    for (const line of commandLines) {
      const target = line.match(/^\s*make\s+([\w.-]+)/)?.[1];
      if (target && !new RegExp(`^${target.replace(".", "\\.")}\\s*:`, "m").test(readText(makefile) ?? ""))
        found.push({ note: `"make ${target}" isn't a target in the Makefile`, line: line.trim() });
    }

  return found.filter(({ note }, index) => found.findIndex((other) => other.note === note) === index);
}

function referencedFiles(readme: string) {
  const links = [...readme.matchAll(/\]\((?!https?:|mailto:|#|\/)([^)\s#?]+)/g)]
    .map((match) => match[1])
    .filter((link) => !/^\.{1,2}\/?$|\/$/.test(link));
  const blocks = [...readme.matchAll(/```[^\n]*\n([\s\S]*?)```/g)]
    .map((match) => match[1])
    .join("\n")
    .split("\n")
    .filter((line) => !/\/absolute\/|path\/to|<[^>\s]+>|\byour[_-]|[├└│]/i.test(line))
    .join("\n");
  const created = new Set(
    [
      ...[...blocks.matchAll(/(?:>|\b(?:cp|mv|touch|mkdir|-o|--output|--out)\s+(?:\S+\s+)?)\s*["']?((?:\.\/)?[\w.\/-]+)/g)].map((match) => match[1]),
      ...[...readme.matchAll(/\b(?:create|add|write|make)\b[^\n`]{0,40}`((?:\.\/)?[\w.\/-]+\.\w+)`/gi)].map((match) => match[1]),
    ].map((reference) => reference.replace(/^\.\//, "")),
  );
  const shownInline = (reference: string) => {
    const name = reference.split("/").at(-1)!;
    return [...readme.matchAll(/([^\n]*)\n(?:[ \t]*\n)?[ \t]*```[^\n]*\n([\s\S]*?)```/g)].some(
      ([, before, content]) => before.includes(name) && !before.trim().startsWith("```") && !content.includes(name),
    );
  };
  const inputs = [...blocks.matchAll(/(?:<[ \t]*|[ \t])(?:\$\(pwd\)\/|\$\{?PWD\}?\/)?((?:\.\/)?[\w-][\w.-]*(?:\/[\w.-]+)*\.(?:txt|json|jsonl|csv|tsv|xml|ya?ml|env|archive|pdf))(?=[\s:"']|$)/gm)]
    .map((match) => match[1].replace(/^\.\//, ""))
    .filter(
      (reference) =>
        !created.has(reference) &&
        !shownInline(reference) &&
        !/^(package(-lock)?|tsconfig|composer)\.json$|docker-compose/.test(reference) &&
        !/(^|[\/_.-])(out|output|outputs|result|results|report|salida)([\/_.-]|$)/i.test(reference),
    );
  const copied = [...blocks.matchAll(/\bcp\s+(?:-\w+\s+)*["']?((?:\.\/)?[\w.\/-]*\.[\w-]+)["']?\s+\S+/g)].map((match) => match[1].replace(/^\.\//, ""));
  return [...new Set([...links, ...inputs, ...copied].map((reference) => decodeURI(reference)))].filter(
    (reference) => !reference.includes("<") && !/path\/to|your[_-]/i.test(reference),
  );
}

function notAtPath(reference: string, paths: string[]) {
  const elsewhere = paths.find((path) => path.split("/").at(-1) === reference.split("/").at(-1));
  return elsewhere ? `${reference} is not at that path (the file is at ${elsewhere})` : `${reference} is not in the submission`;
}

function makeRecipe(makefile: string, target: string) {
  const lines = makefile.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`${target}:`));
  if (start === -1) return "";
  const end = lines.findIndex((line, index) => index > start && !line.startsWith("\t"));
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n");
}

function normalizePath(path: string) {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/");
}

function lineOf(text: string, index = 0) {
  return text.slice(text.lastIndexOf("\n", index) + 1, text.indexOf("\n", index) === -1 ? undefined : text.indexOf("\n", index)).trim().slice(0, 200);
}

function isScannable(path: string) {
  return (
    !isJunk(path) &&
    !/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|poetry\.lock)$/.test(path) &&
    !/\.(png|jpe?g|gif|ico|pdf|zip|woff2?|ttf|mp4|db|sqlite|map)$/i.test(path)
  );
}

function isPlaceholder(line: string) {
  return /your[_-]|xxxx|<[a-z_-]+>|example|placeholder|changeme|\.\.\./i.test(line);
}

function mask(line: string) {
  return line
    .replace(/([A-Za-z0-9_\-]{6})[A-Za-z0-9_\-]{12,}/g, "$1…")
    .slice(0, 160);
}

const spanishWords = new Set(
  "el la los las de del que en para con una por como más este esta proyecto ejecutar instalar archivo también pero cuando donde porque se lo al".split(" "),
);

function spanishRatio(text: string) {
  const words = text.toLowerCase().match(/[a-záéíóúñ]+/g) ?? [];
  if (words.length < 5) return 0;
  return words.filter((word) => spanishWords.has(word)).length / words.length;
}

function basename(path: string) {
  return path.split("/").at(-1) ?? path;
}
