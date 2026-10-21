import Anthropic from "@anthropic-ai/sdk";
import {
  aiGatewayUrl,
  bugPrompt,
  bugReviewFiles,
  codeCharacterLimit,
  codeFileCharacterLimit,
  criteria,
  dataFileListLimit,
  dataPrompt,
  docCharacterLimit,
  docsPrompt,
  fetchedUrlLimit,
  hedgePattern,
  hostingUrlPattern,
  prompt,
  reviewModel,
  rubricFileListLimit,
  rubricPrompt,
  rubrics,
  seedPathPattern,
  testFilePattern,
  verifiedClaimLimit,
  verifyFileCharacterLimit,
  verifyModel,
  verifyPrompt,
} from "./constants";
import {
  Evidence,
  Rubric,
  SubmissionFile,
  TakeHome,
  TakeHomeAnalysis,
} from "./types";
import {
  assembleAnalysis,
  codebaseToString,
  criteriaFor,
  findReadme,
  isBaseCode,
  isGrounded,
  isJunk,
  isTemplateReadme,
  runCodeChecks,
} from "./utils";

export type AnalyzeTakeHomeInput = {
  takeHome: TakeHome;
  files: SubmissionFile[];
  readText: (path: string) => string | undefined;
  rubric?: Rubric;
  assignment?: string;
  isPrivate?: boolean;
  encrypted?: string[];
};

export async function analyzeTakeHome({
  takeHome,
  files,
  readText,
  rubric,
  assignment,
  isPrivate,
  encrypted,
}: AnalyzeTakeHomeInput): Promise<TakeHomeAnalysis> {
  const applies = ({ id }: { id: string }) =>
    (id !== "SPEC_REQUIREMENTS" || !!assignment) &&
    (id !== "REPO_ACCESSIBLE" || isPrivate !== undefined);
  const asks = (id: string) => rubrics.some(({ value }) => criteriaFor(value).some((criterion) => criterion.id === id && applies(criterion)));
  const readmePath = findReadme(files)?.path;
  const readmeText = takeHome.docs ?? "";
  const codeEvidence = runCodeChecks(
    { root: "", files, readmePath, readme: takeHome.docs },
    readText,
    { isPrivate, encrypted },
  );

  const sourceFiles = (takeHome.code ?? []).filter(({ path }) => !isJunk(path));
  const docs = files
    .map(({ path }) => path)
    .filter((path) => path !== readmePath && !isJunk(path) && /\.md$/i.test(path) && !/license|changelog|code_of_conduct|contributing/i.test(path))
    .map((path) => ({ path, linked: readmeText.toLowerCase().includes(path.split("/").at(-1)!.toLowerCase()) }))
    .filter(({ path, linked }) => linked || path.split("/").length <= 2)
    .sort((a, b) => Number(b.linked) - Number(a.linked))
    .slice(0, 5)
    .map(({ path }) => ({ path, content: (readText(path) ?? "").slice(0, docCharacterLimit) }));
  const documentation = [{ path: readmePath ?? "README", content: readmeText || "No README" }, ...docs]
    .map(({ path, content }) => `<doc path="${path}">\n${content}\n</doc>`)
    .join("\n");

  const ownPaths = files.map(({ path }) => path).filter((path) => !isJunk(path));
  const [resolvedRubric, docsEvidence, dataEvidence, codeClaims] = await Promise.all([
    rubric ?? classifyRubric(assignment, documentation, ownPaths),
    readmeIds.some(asks)
      ? reviewDocs(documentation, readmeText, asks, isTemplateReadme(readmeText, assignment))
      : [],
    asks("HAPPY_PATH_DATA") ? reviewData(documentation, ownPaths, [...sourceFiles, ...ownPaths.filter((path) => /(^|\/)\.env[^/]*$/.test(path)).map((path) => ({ path, content: readText(path) ?? "" }))]) : [],
    Promise.all([
      asks("SPEC_REQUIREMENTS") ? assignmentClaims(assignment ?? "", documentation, sourceFiles.filter(({ path }) => isBaseCode(path))) : [],
      asks("BUGS") ? bugClaims(sourceFiles) : [],
    ]).then((claims) => claims.flat()),
  ]);
  const verifiedEvidence = await verifyClaims(codeClaims, documentation, assignment);

  return assembleAnalysis(resolvedRubric, criteriaFor(resolvedRubric).filter(applies), [...codeEvidence, ...docsEvidence, ...dataEvidence, ...verifiedEvidence]);
}

export async function classifyRubric(assignment: string | undefined, documentation: string, paths: string[]): Promise<Rubric> {
  const { rubric } = (await ask<{ rubric: Rubric | "" }>({
    model: reviewModel,
    system: rubricPrompt,
    content: [
      assignment && `<assignment>\n${truncate(assignment, docCharacterLimit)}\n</assignment>`,
      truncate(documentation, docCharacterLimit),
      `<files>\n${paths.slice(0, rubricFileListLimit).join("\n")}\n</files>`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    schema: objectSchema({ rubric: { type: "string", enum: rubrics.map(({ value }) => value) } }),
  })) ?? { rubric: "" };
  return rubric || "fullstack";
}

const readmeIds = ["README_TEMPLATE", "README_DESCRIPTION", "README_SETUP", "README_DECISIONS", "README_RESULTS", "LIVE_DEMO"];

export async function reviewDocs(documentation: string, readme: string, asks: (id: string) => boolean, copiedTemplate: boolean): Promise<Evidence[]> {
  const evidence = await ask<Record<"description" | "setup" | "decisions" | "results" | "demo_url" | "own_words" | "template", string>>({
    model: verifyModel,
    system: docsPrompt,
    content: `<documentation>\n${documentation}\n</documentation>`,
    schema: objectSchema(Object.fromEntries(["description", "setup", "decisions", "results", "demo_url", "own_words", "template"].map((key) => [key, { type: "string" }]))),
  });
  if (!evidence) return [];
  const missing = (key: keyof typeof evidence) => !evidence[key]?.trim();
  const template = copiedTemplate || (missing("own_words") && !missing("template") && isGrounded(evidence.template, [readme]));
  const hosted =
    hostingUrlPattern.test(documentation) ||
    (evidence.demo_url.match(/https?:\/\/[^\s"'`)<>\]]+/g) ?? []).some((url) => !/localhost|127\.0\.0\.1|0\.0\.0\.0|github\.com|gitlab\.com|example\.com/i.test(url));

  const flags: (Evidence | false)[] = [
    template && { id: "README_TEMPLATE", note: "The README has no sentence where you describe your own solution." },
    !template && missing("description") && { id: "README_DESCRIPTION", note: "The documentation doesn't say what the project is or does." },
    missing("setup") && { id: "README_SETUP", note: "The documentation has no commands to install and run the project." },
    !template && missing("decisions") && { id: "README_DECISIONS", note: "The documentation doesn't explain any technical decision or trade-off." },
    !template && missing("results") && { id: "README_RESULTS", note: "The documentation doesn't say what works, what was left out or what would come next." },
    !hosted && { id: "LIVE_DEMO", note: "No link to a hosted version of the app in the documentation." },
  ];
  return flags.filter((item): item is Evidence => !!item && asks(item.id));
}

export async function reviewData(documentation: string, paths: string[], sourceFiles: { path: string; content: string }[]): Promise<Evidence[]> {
  if (paths.some((path) => seedPathPattern.test(path))) return [];
  const urls = [
    ...new Set(
      sourceFiles
        .filter(({ path }) => !testFilePattern.test(path))
        .flatMap(({ content }) => content.match(/https?:\/\/[^\s"'`)<>]+/g) ?? [])
        .filter((url) => !/localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com|w3\.org|schema|github\.com|npmjs|nextjs\.org|vercel\.com|fonts\./i.test(url)),
    ),
  ].slice(0, fetchedUrlLimit);
  const { source } = (await ask<{ source: "shipped" | "external" | "none"; evidence: string }>({
    model: verifyModel,
    system: dataPrompt,
    content: `<documentation>\n${documentation}\n</documentation>\n\n<files>\n${paths.slice(0, dataFileListLimit).join("\n")}\n</files>\n\n<fetched-urls>\n${urls.join("\n")}\n</fetched-urls>`,
    schema: objectSchema({ source: { type: "string", enum: ["shipped", "external", "none"] }, evidence: { type: "string" } }),
  })) ?? { source: "shipped" };
  return source === "none" ? [{ id: "HAPPY_PATH_DATA", note: "No seed data or sample input in the submission." }] : [];
}

type Claim = { id: "BUGS" | "SPEC_REQUIREMENTS"; quote: string; explanation: string; file?: { path: string; content: string } };

async function bugClaims(sourceFiles: { path: string; content: string }[]): Promise<Claim[]> {
  const candidates = sourceFiles
    .filter(({ path, content }) => isBaseCode(path) && content.length > 300)
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, bugReviewFiles);

  return (
    await Promise.all(
      candidates.map(async (file) => {
        const { bugs } = (await ask<{ bugs: { quote: string; explanation: string }[] }>({
          model: reviewModel,
          system: bugPrompt,
          content: `<file path="${file.path}">\n${truncate(file.content, codeFileCharacterLimit)}\n</file>`,
          schema: objectSchema({
            bugs: { type: "array", items: objectSchema({ quote: { type: "string" }, explanation: { type: "string" } }) },
          }),
        })) ?? { bugs: [] };
        return bugs
          .slice(0, 2)
          .filter(({ quote, explanation }) => quote && isGrounded(quote, [file.content]) && !hedgePattern.test(explanation))
          .map((bug) => ({ id: "BUGS" as const, ...bug, file }));
      }),
    )
  ).flat();
}

async function assignmentClaims(assignment: string, documentation: string, sourceFiles: { path: string; content: string }[]): Promise<Claim[]> {
  let budget = codeCharacterLimit;
  const code = sourceFiles.flatMap((file) => {
    if (budget <= 0) return [];
    const content = truncate(file.content, Math.min(codeFileCharacterLimit, budget));
    budget -= content.length;
    return [{ ...file, content }];
  });
  const { findings } = (await ask<{ findings: { note: string; file: string; snippet: string }[] }>({
    model: reviewModel,
    system: prompt,
    content: `<criteria>\nSPEC_REQUIREMENTS: ${criteria.SPEC_REQUIREMENTS.detects}\n</criteria>\n\n<assignment>\n${assignment}\n</assignment>\n\n<documentation>\n${documentation}\n</documentation>\n\n<code>\n${codebaseToString(code, 0)}\n</code>`,
    schema: objectSchema({
      findings: { type: "array", items: objectSchema({ note: { type: "string" }, file: { type: "string" }, snippet: { type: "string" } }) },
    }),
  })) ?? { findings: [] };
  const sources = [documentation, ...code.map(({ content }) => content)];
  return findings
    .filter(({ snippet, note }) => (!snippet || isGrounded(snippet, sources)) && !hedgePattern.test(note))
    .slice(0, 3)
    .map(({ note, file, snippet }) => ({ id: "SPEC_REQUIREMENTS" as const, quote: snippet, explanation: note, file: sourceFiles.find(({ path }) => path === file) }));
}

async function verifyClaims(claims: Claim[], documentation: string, assignment?: string): Promise<Evidence[]> {
  const batch = [...claims.filter(({ id }) => id === "SPEC_REQUIREMENTS"), ...claims.filter(({ id }) => id === "BUGS")].slice(0, verifiedClaimLimit);
  if (!batch.length) return [];
  const involved = [...new Map(batch.flatMap(({ file }) => (file ? [[file.path, file] as const] : []))).values()];
  const perFile = Math.floor(verifyFileCharacterLimit / Math.max(1, involved.length));
  const { verdicts } = (await ask<{ verdicts: { claim: number; confirmed: boolean; explanation: string }[] }>({
    model: verifyModel,
    system: verifyPrompt,
    content: `${assignment ? `<assignment>\n${truncate(assignment, 8000)}\n</assignment>\n\n` : ""}<documentation>\n${truncate(documentation, 12000)}\n</documentation>\n\n${involved
      .map((file) => `<file path="${file.path}">\n${truncate(file.content, perFile)}\n</file>`)
      .join("\n\n")}\n\n<claims>\n${batch
      .map(({ id, quote, explanation, file }, index) => `<claim number="${index + 1}" kind="${id === "BUGS" ? "bug" : "unmet requirement"}"${file ? ` file="${file.path}"` : ""}>\nQuote:\n${quote}\n\nClaim: ${explanation}\n</claim>`)
      .join("\n")}\n</claims>`,
    schema: objectSchema({
      verdicts: {
        type: "array",
        items: objectSchema({ claim: { type: "integer" }, confirmed: { type: "boolean" }, explanation: { type: "string" } }),
      },
    }),
  })) ?? { verdicts: [] };
  return verdicts.flatMap(({ claim, confirmed, explanation }) => {
    const item = batch[claim - 1];
    return item && confirmed && !hedgePattern.test(explanation)
      ? [{ id: item.id, file: item.file?.path, snippet: item.quote || undefined, note: explanation }]
      : [];
  });
}

async function ask<T>({ model, system, content, schema }: { model: string; system: string; content: string; schema: Record<string, unknown> }): Promise<T | undefined> {
  const response = await new Anthropic({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: aiGatewayUrl }).messages.create({
    model,
    max_tokens: 4000,
    system,
    output_config: { effort: model === verifyModel ? "medium" : "low", format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });
  const text = response.stop_reason === "refusal" ? undefined : response.content.find((block) => block.type === "text")?.text;
  return text ? (JSON.parse(text) as T) : undefined;
}

function objectSchema(properties: Record<string, object>) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

function truncate(content: string, limit: number) {
  return content.length > limit ? `${content.slice(0, limit)}\n<content-truncated />` : content;
}
