import criteriaFile from "./criteria.json";
import { Color, Criterion, Rubric } from "./types";

export const prompt = `You review a take-home coding challenge. Your feedback goes to the candidate, who will fix what you point out. The reviewer only has this zip or repository: nothing the candidate wrote elsewhere reaches them.

You can read the file tree and the files you're given. You can't run anything. The most common problems are friction: anything that stops a reviewer from understanding and running the project in a few minutes.

You get a list of criteria. For each one, report a finding only when the submission clearly fails it. Passing criteria get no finding.

Rules:

* Quote a snippet copied verbatim from a file, 1 to 6 lines, and name the file (README for the README). If you can't quote it, don't report it. Only when something is missing entirely (no tests, no live demo link) leave snippet and file empty.
* Write the note as a short, concrete instruction to the candidate about this specific case.
* At most 3 findings per criterion. Report only problems you're sure of; when in doubt, leave it out.
* Report a finding only when the criterion is clearly failed. If your note would say the submission is acceptable, that something is fine, or that you can't confirm it, don't report it.
* The documentation is the README plus the docs it links to or that sit at the top level. Something explained in any of them is not missing.
* The file tree lists every file except dependencies and caches. Never claim a file, folder or script is missing when it appears in the tree or in package.json.
* Files ending with <content-truncated /> were cut by the reviewer tool, not by the candidate. Never report anything as incomplete, cut off or missing because of that.
* For code, report only defects visible in the lines you quote. Never speculate about runtime behavior, missing features or hypothetical edge cases.
* "TODO" comments are fine in a take-home.`;

export const processableFileExtensions = [
  "astro",
  "bash",
  "bat",
  "c",
  "cpp",
  "cs",
  "dart",
  "dockerfile",
  "go",
  "java",
  "js",
  "jsx",
  "kt",
  "m",
  "matlab",
  "php",
  "pl",
  "py",
  "r",
  "rb",
  "rs",
  "scala",
  "sh",
  "sql",
  "swift",
  "svelte",
  "ts",
  "tsx",
  "vue",
];

export const repoTextFilePattern = /\.(md|txt|rst|json|ya?ml|toml|ini|cfg|lock)$|(^|\/)(\.env[^/]*|[^/]*\.env\.[^/]+|Makefile|Dockerfile[^/]*|Procfile|Gemfile|\.gitignore|\.dockerignore|requirements[^/]*\.txt)$/i;
export const repoFileLimit = 400;

export const loadingMessages = [
  "Initializing AI thought process",
  "Activating neural network",
  "Generating embeddings of the problem",
  "Simulating a billion test cases",
  "Performing a recursive self-improvement cycle",
  "Fine-tuning my model weights",
  "Verifying output against training data",
  "Cross-referencing solutions in parallel universes",
  "Predicting the thoughts of a Principal Engineer",
].map((message) => `${message}...`);

export const loadingMessageInterval = 1000 * 3;

export const cookieName = "takeHomeCheckerinstallationId";

export const hostingUrlPattern = /https?:\/\/[\w.-]+\.(vercel\.app|netlify\.app|up\.railway\.app|onrender\.com|fly\.dev|herokuapp\.com|pages\.dev|github\.io|streamlit\.app|hf\.space|web\.app|firebaseapp\.com|amplifyapp\.com|azurewebsites\.net|azurestaticapps\.net|run\.app|koyeb\.app|deno\.dev|surge\.sh)\b/i;
export const aiGatewayUrl = "https://ai-gateway.vercel.sh";
export const reviewModel = "anthropic/claude-haiku-5.5";
export const verifyModel = "anthropic/claude-sonnet-5.5";
export const bugReviewFiles = 6;
export const verifiedClaimLimit = 6;
export const verifyFileCharacterLimit = 80000;
export const junkDirectories = ["node_modules", ".venv", "venv", "__pycache__", ".pytest_cache", ".mypy_cache", ".next", ".turbo", "target", ".gradle", "Pods"];
export const aiToolPaths = /(^|\/)(\.claude|\.agents|\.cursor|\.windsurf|\.aider[^/]*|CLAUDE\.md|AGENTS\.md|\.github\/copilot-instructions\.md)(\/|$)/;
export const aiLeftoverPatterns = /^#+\s.*\(optional\)\s*$|add screenshots|\[insert [^\]]+\]/im;
export const seedPathPattern = /(^|\/)(seeds?|fixtures?|mocks?|mock[-_][^/]+|samples?|sample[-_]data|demo[-_]data|(examples?|samples?)[ _-]?(inputs?|data|files))\/|(^|\/)(sample|example)?[-_]?inputs?(\.[a-z]+)+$|(^|\/)[^/]*(seed|fixture|mock|sample)[^/]*\.(json|csv|tsv|sql|ya?ml|rb|ts|js|mjs|py|go|java|kt|cs|php|txt|env)$|(^|\/)data\/[^/]+\.(json|csv|sql)$/i;
export const nonBaseCodePattern = /(^|\/)(fixtures?|testdata|test-data|mocks?|e2e|cypress|playwright|migrations?|configs?|scripts?|tools?|tooling|labels?|seeds?|evals?|evaluation|benchmarks?|bench|notebooks?|examples?|docs?|\.github|\.claude|\.agents|\.cursor|\.vscode)\/|\.d\.ts$|(^|\/)[^/]*\.config\.[a-z]+$|(^|\/)(conftest|setup|manage|noxfile)\.py$|(^|\/)(setupTests|test-utils)\.[jt]sx?$/i;
export const testFilePattern = /(^|\/|[._-])(tests?|__tests__|specs?)\/|[._-](test|spec)\.[a-z]+$|_test\.(go|py|rb)$|(^|\/)(test_[^/]+|tests?)\.py$|Tests?\.(cs|java|kt|swift)$/i;
export const envReadPattern = /process\.env\.([A-Z][A-Z0-9_]+)|process\.env\[["']([A-Z][A-Z0-9_]+)|import\.meta\.env\.([A-Z][A-Z0-9_]+)|os\.(?:environ\.get|getenv)\(\s*["']([A-Z][A-Z0-9_]+)|os\.environ\[["']([A-Z][A-Z0-9_]+)|os\.Getenv\("([A-Z][A-Z0-9_]+)|System\.getenv\("([A-Z][A-Z0-9_]+)|ENV\[["']([A-Z][A-Z0-9_]+)|ENV\.fetch\(["']([A-Z][A-Z0-9_]+)/g;
export const envExamplePattern = /(^|\/)(\.env\.(example|sample|template|dist|defaults?|docker|local\.example)|[^/]*\.env\.example|env\.example|example\.env|\.env-example)$/i;
export const envConfigPattern = /(^|\/)((docker-)?compose[^/]*\.ya?ml|Dockerfile[^/]*|Makefile|\.env[^/]*|\.envrc|app\.json|render\.ya?ml|fly\.toml|vercel\.json|netlify\.toml)$/i;
export const ignoredEnvVars = ["BUNDLE_GEMFILE", "RAILS_MAX_THREADS", "RAILS_MIN_THREADS", "PIDFILE", "WEB_CONCURRENCY", "RAILS_LOG_LEVEL", "RAILS_SERVE_STATIC_FILES", "RAILS_MASTER_KEY", "NODE_ENV", "PORT", "HOST", "CI", "HOME", "PATH", "DEBUG", "LOG_LEVEL", "TZ", "RAILS_ENV", "RACK_ENV", "PWD", "MODE", "DEV", "PROD", "BASE_URL", "SSR"];
export const frameworkReadmePattern = /^\s*(#+\s*)?(This is a \[Next\.js\]|This project was bootstrapped with \[?Create React App|Getting Started with Create React App|React \+ TypeScript \+ Vite|This README would normally document)/i;
export const silverMention = /(^|[^a-z])silver(?!light)(?=$|[^a-z]|dev)/i;
export const generatedNamePattern = /\b\d{4}_[a-z]+(_[a-z]+)+\b/g;
export const docCredentialPattern = /\b(client[_ ]?secret|secret[_ ]?key|api[_ ]?key|access[_ ]?token|password)\b["'`*]*\s*[:=]\s*["'`]?(?=[\w+/-]*\d)(?=[\w+/-]*[a-z])[\w+/-]{20,}/i;

export const providerSecretPatterns: [string, RegExp][] = [
  ["OpenAI key", /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/],
  ["Anthropic key", /\bsk-ant-[A-Za-z0-9_-]{32,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Stripe live key", /\b[sr]k_live_[A-Za-z0-9]{20,}/],
  ["Clerk secret key", /\bsk_(test|live)_[A-Za-z0-9]{40,}/],
  ["GitHub token", /\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{60,})/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{20,}/],
  ["Private key", /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["Credential-bearing URL", /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis|amqps?|smtps?):\/\/[^\s:/@"']+:[^\s@"'$]{6,}@(?!localhost|127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal|[a-z0-9.-]*\.(?:localtest\.me|lvh\.me|nip\.io|sslip\.io)\b)[a-z0-9-]+\.[a-z0-9.-]+/i],
];

export const setupStorageKey = "take-home-checker-setup";

export const takeHomeGuideUrl =
  "https://docs.silver.dev/interview-ready/technical-fundamentals/code-quality/guia-de-takehomes";
export const codeFileCharacterLimit = 15000;
export const codeCharacterLimit = 200000;
export const docCharacterLimit = 20000;

export const criteria = criteriaFile as Record<string, Criterion>;

export const rubrics: { value: Rubric; label: string }[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend (API or service)" },
  { value: "cli", label: "Backend (CLI or file processor)" },
  { value: "fullstack", label: "Full stack" },
  { value: "ml", label: "ML / AI" },
];

export const heavyFileBytes = 5_000_000;
export const dataFilePattern = /\.(db|sqlite3?|csv|tsv|parquet|jsonl|pt|pth|onnx|h5|pkl|joblib|safetensors|bin|npy|npz|jar|war|ear|apk|aab|ipa|traineddata|tflite|gguf)$/i;
export const scaffoldedAgentFile = /nextjs-agent-rules|^\s*@AGENTS\.md\s*$/;
export const credentialKeyPattern = /^\s*(export\s+)?[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD|PASS|PWD|PRIVATE|CREDENTIALS?|DSN|DATABASE_URL|DB_URL|MONGO_URI|CONNECTION_STRING)[A-Z0-9_]*\s*=\s*["']?([^"'\s#]+)/i;
export const archiveFilePattern = /\.(zip|tar|tgz|gz|rar|7z)$/i;
export const videoFilePattern = /\.(mp4|mov|avi|mkv|webm|m4v)$/i;
export const imageFilePattern = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?|heic)$/i;
export const assignmentCharacterLimit = 20000;
export const findingLimits: Record<Color, number> = { red: 5, yellow: 5, info: 3 };
export const evidenceLimit = 2;
export const noRedFlags = 1;
export const yesYellowFlags = 1;
export const strongNoRedFlags = 2;
export const hedgePattern = /\b(can'?t|cannot|could not|couldn'?t|unable to|not able to) (confirm|verify|see|tell|determine)|\b(is|are|looks|seems|appears) (acceptable|fine|ok|correct|consistent|accurate)\b|\bno (issue|problem|finding|mismatch|change needed)\b|\bmight\b|\bmay (not|be)\b|\bappears to\b|\bseems to\b|\bif (it|this) (is|was) intentional|\bconsider\b|\bnot (provided|shown|visible|included) (in|here)|\bwas not provided\b|\btruncated\b|\b(so )?(this|it) passes\b|\bnot a (clear )?failure\b|\bnot a (real )?(problem|issue|defect)\b|\bnot (clearly |really |actually )?(a |an )?(clear |real )?(crash|bug|defect|dead)\b|\bignore\b|\bnothing (clearly )?(dead|wrong)/i;
export const textFileBytes = 500_000;
export const uploadBytes = 4_000_000;
export const zipBytesLimit = 200_000_000;
export const readmeMinCharacters = 200;
export const blockingFolderBytes = 1_000_000;
export const blockingFileBytes = 1_000_000;
export const binaryFilePattern = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?|heic|mp4|mov|avi|mkv|webm|m4v|mp3|wav|ogg|flac|pdf|docx?|xlsx?|pptx?|zip|tar|tgz|gz|bz2|xz|rar|7z|jar|war|ear|apk|aab|ipa|db|sqlite3?|parquet|pt|pth|onnx|h5|pkl|joblib|safetensors|bin|npy|npz|woff2?|ttf|otf|eot|exe|dll|so|dylib|class|pyc|o|a|lockb)$/i;

export const docsPrompt = `You read the documentation of a take-home coding challenge. Find evidence; don't judge.

For each item, copy one short quote, verbatim, from the documentation that shows it. Leave the quote empty only when no part of the documentation covers it. Look at every doc, not only the README.

* description: any passage that tells what the project is about: a title that names it, a summary, an overview, a features list, or a section that describes the solution. It can be anywhere in the docs and in any wording. Almost every README has one.
* setup: any instruction to install or run the project locally. One command is enough.
* decisions: any technical decision or trade-off the candidate mentions: a library, framework, pattern, architecture or approach they chose, or something they simplified. A passing mention counts and no reason is needed.
* results: what works, results or metrics, limitations, what was left out, or what would come next.
* demo_url: a link to a hosted, running version of the app or API. A localhost address, a repository link, or a placeholder is not a demo.
* own_words: a sentence in which the candidate describes their own solution, approach, decisions or results. Text from the assignment (instructions addressed to the candidate, requirements, a placeholder section for candidate notes), the company's starter README or a framework template doesn't count.
* template: a passage from the README file itself showing it is the assignment or a starter template rather than the candidate's write-up: instructions addressed to the candidate ("your task is", "you should implement"), the exercise requirements, or a placeholder left unfilled ("add your notes here"). Leave it empty when the README is the candidate's own write-up, even if it quotes or summarizes the assignment.`;

export const rubricPrompt = `Classify the role a take-home coding challenge was given for, using the assignment if present, the documentation and the file list. Classify what the company asked for, not the extras the candidate built.

* frontend: a web or mobile UI. The data comes from an API the company gives, a mock, static files, or route handlers inside the frontend app that only fetch or forward that data.
* backend: an API, service, bot or integration that keeps running and answers requests.
* cli: a command-line tool, script or file processor that reads input, writes output and exits.
* fullstack: the company asked for both a UI and the API or service behind it. A UI the candidate added on top of a service, or route handlers that only fetch data for a UI, don't make it fullstack.
* ml: a model, data science or AI pipeline is the core of the work (training, evaluating, detecting, classifying, extracting with an LLM), even when it is served through an API or shown on a small demo page.

When the work centers on one side, pick that side, not fullstack.`;

export const rubricFileListLimit = 300;

export const dataPrompt = `A reviewer follows the README of a take-home coding challenge to try it. The app, API, CLI or model needs data to show or process. Using the documentation, the file list and the URLs the code fetches, find where that data comes from.

* source:
  * "shipped": the data is in the submission: a seed script, fixtures, mock or sample JSON/CSV, SQL inserts, a hardcoded sample list, a sample input file for a CLI, example input written in the documentation that the reviewer can paste or save, or a dataset for a model.
  * "external": the data comes from an API, dataset or service the assignment provides, or the app creates it on start.
  * "created": the reviewer creates the data through the app itself (its UI, API or chat), or registers their own account.
  * "none": the reviewer must bring their own input file or dataset, or load data by hand outside the app, before trying it.
* evidence: one path copied verbatim from the file list, or a short verbatim quote from the documentation, that shows the source. Empty only when the source is "none".

When in doubt, don't answer "none".`;

export const placeholderValuePattern = /^$|^<.*>$|your|change[-_ ]?me|replace|insert|placeholder|^x{3,}$|^\*{2,}$|^\.\.\.$|\.\.\.$|^todo$/i;
export const selfChosenSecretPattern = /JWT|SESSION|COOKIE|AUTH_SECRET|APP_SECRET|SECRET_KEY_BASE|WEBHOOK_SECRET|PASSWORD|SERVICE_API_KEY|INTERNAL/i;
export const optionalEnvCommentPattern = /optional|opt-in|skips?\b|unset|left blank|leave [^\n]{0,30}blank|if blank|disables?|defaults? to|fallback/i;
export const optionalEnvPattern = /ANALYTICS|TRACKING|_GA_|SENTRY|POSTHOG|DSN|CORS|CRON|APP_URL|SITE_URL/i;
export const dataFileListLimit = 500;
export const fetchedUrlLimit = 20;

export const bugPrompt =`You review one source file from a candidate's take-home challenge. Report only definite bugs: code that crashes or produces a wrong result on a normal, reachable path, visible in this file.

* Quote the exact lines, verbatim.
* Style, naming, missing features, missing validation, performance, and "could fail if…" cases are not bugs.
* If the file ends with <content-truncated />, the cut is ours; never report code as incomplete.
* Most files have no bugs. When in doubt, report nothing.`;

export const verifyPrompt = `A first-pass reviewer makes claims about a candidate's take-home. Verify each claim independently before the candidate sees it, and return one verdict per claim number. Trace the actual code and read the documentation you're given.

Confirm a bug claim only if all of these hold:
1. The quoted code is part of the candidate's working submission: not code the assignment provided, not an unused or abandoned stub, not a test.
2. It definitely crashes or produces a wrong result on a reachable path.
3. Nothing elsewhere in the file (a guard, an early return, a default) prevents it.

Confirm an unmet-requirement claim only if all of these hold:
1. The assignment states the requirement explicitly.
2. The submission doesn't implement it at all, judging by the code and the documentation.
3. It isn't about how thoroughly something was tested or evaluated, a limitation the documentation already acknowledges, or wording.

If any of these fails or you're unsure, reject it. Reject duplicates of a claim you already confirmed. When you confirm, write the explanation as a short instruction to the candidate.`;
