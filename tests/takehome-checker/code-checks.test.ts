import { describe, expect, it } from "vitest";
import { hostingUrlPattern, seedPathPattern, testFilePattern } from "@/takehome-checker/constants";
import { criteriaFor, findReadme, isBaseCode, ratingReason, runCodeChecks, scoreFor } from "@/takehome-checker/utils";

function check(files: Record<string, string>, context?: Parameters<typeof runCodeChecks>[2]) {
  const list = Object.entries(files).map(([path, content]) => ({ path, size: content.length }));
  const readmeFile = findReadme(list);
  const submission = {
    root: "/",
    files: list,
    readmePath: readmeFile?.path,
    readme: readmeFile ? files[readmeFile.path] : undefined,
  };
  return runCodeChecks(submission, (path) => files[path], context).map(({ id }) => id);
}

const readme = {
  "README.md": "# Store\n\n![demo](demo.gif)\n\nRun `docker compose up` and open the app.",
  "docker-compose.yml": "services: {}",
  "demo.gif": "",
  "src/app.test.ts": "",
  "db/seeds.rb": "",
};

describe("runCodeChecks", () => {
  it("passes a clean submission", () => {
    expect(check({ ...readme, "src/index.ts": "export {}" })).toEqual([]);
  });

  it("flags a provider-shaped key, even in tests", () => {
    expect(check({ ...readme, "test/api.test.ts": `const key = "sk-proj-${"a1B2".repeat(12)}"` })).toContain("SECRETS");
  });

  it("ignores placeholders and local database URLs", () => {
    expect(
      check({
        ...readme,
        ".env.example": "OPENAI_API_KEY=sk-your-key-here-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "docker-compose.yml": "DATABASE_URL=postgres://postgres:postgres@localhost:5432/app",
      }),
    ).not.toContain("SECRETS");
  });

  it("flags a remote credential-bearing database URL and the .env holding it", () => {
    expect(
      check({ ...readme, ".env": "DATABASE_URL=postgresql://admin:s3cretpass@db.abcd.supabase.co:5432/postgres" }),
    ).toEqual(["SECRETS", "ENV_FILE"]);
  });

  it("flags shipped dependencies, a missing README and missing Docker", () => {
    expect(check({ "node_modules/react/index.js": "", "target/app.jar": "", "src/app.ts": "" })).toEqual([
      "DEPENDENCIES_SHIPPED",
      "DEPENDENCIES_SHIPPED",
      "README",
      "DOCKER",
      "TESTS",
    ]);
  });

  it("flags unpinned Python dependencies and a private repository", () => {
    expect(check({ ...readme, "main.py": "", "requirements.txt": "fastapi==0.110\npandas\n" }, { isPrivate: true })).toEqual([
      "REPO_ACCESSIBLE",
      "PINNED_DEPENDENCIES",
    ]);
  });

  it("accepts a renamed top-level write-up as the README", () => {
    expect(findReadme([{ path: "NOTES.md", size: 10 }, { path: "docs/README.md", size: 5 }])?.path).toBe(
      "docs/README.md",
    );
    expect(findReadme([{ path: "NOTES.md", size: 10 }, { path: "LICENSE.md", size: 50 }])?.path).toBe("NOTES.md");
  });
});

describe("criteriaFor", () => {
  const colors = (rubric: Parameters<typeof criteriaFor>[0]) =>
    Object.fromEntries(criteriaFor(rubric).map(({ id, color }) => [id, color]));

  it("lets the rubric override the shared color", () => {
    expect(colors("frontend").LIVE_DEMO).toBe("yellow");
    expect(colors("cli").LIVE_DEMO).toBeUndefined();
  });

  it("skips criteria the rubric doesn't list", () => {
    expect(colors("cli").LIVE_DEMO).toBeUndefined();
    expect(colors("frontend").DOCKER).toBeUndefined();
    expect(colors("cli").DOCKER).toBe("yellow");
    expect(colors("cli").SECRETS).toBe("red");
  });
});

describe("runCodeChecks evidence", () => {
  it("reports each shipped dependency folder once, ignoring macOS metadata and binary files", () => {
    const files = {
      ...readme,
      "target/app.jar": "",
      "target/classes/app/Main.class": "",
      "__MACOSX/node_modules/._react": "",
      "tmp/cache/bootsnap/compile": "\u0000-----BEGIN RSA PRIVATE KEY-----",
    };
    const list = Object.entries(files).map(([path, content]) => ({ path, size: content.length }));
    const evidence = runCodeChecks(
      { root: "/", files: list, readmePath: "README.md", readme: files["README.md"] },
      (path) => files[path as keyof typeof files],
    );
    expect(evidence.map(({ id, file }) => `${id}:${file}`)).toEqual([
      "DEPENDENCIES_SHIPPED:target",
      "OS_JUNK:__MACOSX/node_modules/._react",
    ]);
  });
});

describe("runCodeChecks referenced files and config", () => {
  it("flags input files the README uses but the zip doesn't include", () => {
    expect(
      check({
        ...readme,
        "README.md": readme["README.md"] + "\n\n```bash\npython main.py < input.txt > output.json\ncp .env.example .env\n./app --source ./data/items.json\n```\nSee [notes](docs/NOTES.md).",
        "main.py": "",
        "requirements.txt": "x==1",
        "docs/notes.md": "",
      }),
    ).toEqual(["NOTES_OUTSIDE_SUBMISSION", "NOTES_OUTSIDE_SUBMISSION", "NOTES_OUTSIDE_SUBMISSION"]);
  });

  it("flags env vars with no example file only when the README doesn't mention them", () => {
    const code = { "src/db.ts": "const url = process.env.DATABASE_URL;" };
    expect(check({ ...readme, ...code })).toEqual(["CONFIG_EXAMPLE"]);
    expect(check({ ...readme, ...code, ".env.example": "DATABASE_URL=postgres://postgres:postgres@localhost:5432/app" })).toEqual([]);
    expect(check({ ...readme, ...code, "README.md": readme["README.md"] + " Set DATABASE_URL." })).toEqual([]);
  });

  it("ignores AI config and env files inside dependencies", () => {
    expect(check({ ...readme, "node_modules/nanoid/.claude/settings.local.json": "" })).toEqual(["DEPENDENCIES_SHIPPED"]);
  });
});

describe("runCodeChecks .env files and heavy files", () => {
  it("only flags a committed .env that holds credential-like values", () => {
    expect(check({ ...readme, ".env": "PORT=3000\nDATABASE_PATH=./data.db" })).toEqual([]);
    expect(check({ ...readme, ".env.test": "DATABASE_URL=postgres://postgres:postgres@localhost:5432/test" })).toEqual([]);
    expect(check({ ...readme, ".env": "STRIPE_SECRET=sk_9f8a7b6c5d4e3f2a1b0c" })).toEqual(["ENV_FILE"]);
    expect(check({ ...readme, ".env": "WEBHOOK_SECRET=test_secret\nAPI_TOKEN=test\nINTERNAL_SECRET=internal-dev-secret" })).toEqual([]);
    expect(check({ ...readme, ".env.docker": "DATABASE_URL=postgres://dev:dev@postgres:5432/app" })).toEqual([]);
  });

  it("doesn't count datasets or model weights as heavy files", () => {
    const files = { ...readme, "data/catalog.db": "", "models/model.pt": "", "logs/dev.log": "" };
    const list = Object.entries(files).map(([path]) => ({ path, size: /\.(db|pt|log)$/.test(path) ? 20_000_000 : 10 }));
    const ids = runCodeChecks({ root: "/", files: list, readmePath: "README.md", readme: files["README.md"] }, (path) => files[path as keyof typeof files]).map(({ id, file }) => `${id}:${file}`);
    expect(ids).toEqual(["HEAVY_FILES:logs/dev.log"]);
  });

  it("doesn't flag an input file the README tells the reader to create", () => {
    expect(
      check({ ...readme, "README.md": readme["README.md"] + "\n\nCreate a file `items.txt` with:\n\n```bash\njava -jar app.jar < items.txt\n```" }),
    ).toEqual([]);
  });
});

describe("runCodeChecks Docker in the README", () => {
  it("flags a Dockerfile the docs never mention", () => {
    expect(check({ "README.md": "# App\n\nRun `npm start`.", Dockerfile: "FROM node", "src/app.test.ts": "", "data/seed.json": "" })).toEqual(["DOCKER_IN_README", "SCREENSHOTS"]);
    expect(check({ "README.md": "# App\n\nRun `docker compose up`.", Dockerfile: "FROM node", "src/app.test.ts": "", "data/seed.json": "" })).toEqual(["SCREENSHOTS"]);
  });
});

describe("runCodeChecks generated files", () => {
  it("doesn't flag paths in tree diagrams or data examples", () => {
    expect(check({ ...readme, "README.md": readme["README.md"] + "\n\n```\nout/\n└── build/\n    ├── main.js\n```\n\n```\nNAME/report.csv\nTYPE/.csv\n```" })).toEqual([]);
  });

  it("doesn't flag files an earlier command writes into an output folder", () => {
    expect(
      check({ ...readme, "README.md": readme["README.md"] + "\n\n```sh\npython3 prepare.py data out/build/items\npython3 report.py out/build/items/index.json\n```", "prepare.py": "", "report.py": "", "requirements.txt": "pandas==2.2.0" }),
    ).toEqual([]);
  });
});

describe("runCodeChecks setup friction", () => {
  it("flags placeholder env values, AI provider keys included, except optional lines", () => {
    const base = { ...readme, Dockerfile: "", "data/seed.json": "" };
    expect(check({ ...base, ".env.example": "SERVICE_TOKEN=your_token_here\nAPI_BASE=\nPORT=3000" })).toEqual(["SETUP_FRICTION", "SETUP_FRICTION"]);
    expect(check({ ...base, ".env.example": "SENTRY_DSN= # optional\nDB_URL=sqlite:///app.db\nAPI_URL=http://localhost:3000\nJWT_SECRET=change-me\nCORS_ORIGIN=*" })).toEqual([]);
    expect(check({ ...base, ".env.example": "OPENAI_API_KEY=sk-..." })).toEqual(["SETUP_FRICTION"]);
    expect(check({ ...base, ".env.example": "API_BASE=", "src/api.ts": "const base = process.env.API_BASE ?? '/api';" })).toEqual([]);
    expect(check({ ...base, "README.md": readme["README.md"] + "\n\n`API_BASE` is optional.", ".env.example": "API_BASE=" })).toEqual([]);
  });
});

describe("runCodeChecks edge cases", () => {
  const base = { ...readme, Dockerfile: "", "data/seed.json": "" };

  it("only treats (Optional) on headings outside code blocks as a leftover", () => {
    expect(check({ ...base, "README.md": readme["README.md"] + "\n\n- Docker (Optional)\n\n```sh\n# Seed with demo data (optional)\nnpm run seed\n```" })).toEqual([]);
    expect(check({ ...base, "README.md": readme["README.md"] + "\n\n## Visuals (Optional)" })).toEqual(["TEMPLATE_LEFTOVERS"]);
  });

  it("skips env vars whose comment paragraph says they're optional", () => {
    expect(check({ ...base, ".env.example": "# Optional: login returns 503 until set.\nPAYMENTS_CLIENT_ID=\n# Must match the provider app.\nPAYMENTS_REDIRECT_URI=http://localhost/cb\nPAYMENTS_ACCOUNT_ID=\n\n# Leaving it unset disables webhooks.\nWEBHOOK_TOKEN=" })).toEqual([]);
    expect(check({ ...base, ".env.example": "# From the provider app.\nPAYMENTS_CLIENT_ID=" })).toEqual(["SETUP_FRICTION"]);
    expect(check({ ...base, ".env.example": "# The AI step is opt-in and skipped when the key is unset.\n\nANTHROPIC_API_KEY=" })).toEqual([]);
  });

  it("treats loopback hostnames as local database URLs", () => {
    expect(check({ ...base, ".github/workflows/ci.yml": "DATABASE_URL: postgres://postgres:postgres@db.localtest.me:5432/app" })).toEqual([]);
  });

  it("doesn't flag an input file whose contents the README shows", () => {
    const shown = "\n\n```bash\njava -jar app.jar < input.txt\n```\n\nHere is what input.txt looks like:\n```json\n[{\"id\":1}]\n```";
    expect(check({ ...base, "README.md": readme["README.md"] + shown })).toEqual([]);
    expect(check({ ...base, "README.md": readme["README.md"] + "\n\nRun it with sample.env:\n\n```bash\n./app sample.env\n```" })).toEqual(["NOTES_OUTSIDE_SUBMISSION"]);
  });

  it("counts Makefile targets that run Docker as documented Docker", () => {
    expect(check({ "README.md": "# App\n\n![demo](demo.gif)\n\nRun `make start`.", "docker-compose.yml": "", Makefile: "start:\n\tdocker-compose up", "demo.gif": "", "src/app.test.ts": "", "data/seed.json": "" })).toEqual([]);
  });

  it("flags stray archives at any size but not small videos", () => {
    expect(check({ ...base, "public/demo.mp4": "x".repeat(500_000) })).toEqual([]);
    expect(check({ ...base, "starter.zip": "x".repeat(70_000) })).toEqual(["HEAVY_FILES"]);
  });
});

describe("runCodeChecks secrets, Silver mentions and referenced files", () => {
  const base = { ...readme, Dockerfile: "", "data/seed.json": "" };

  it("flags a long random secret written in the docs but not doc examples", () => {
    expect(check({ ...base, "docs/notes.txt": "Client ID: 1a2b3c4d\nClient Secret: Ab12Cd34Ef56Gh78Ij90Kl12Mn34Op56" })).toEqual(["SECRETS"]);
    expect(check({ ...base, "docs/API.md": '{ "password": "securepassword123" }\nOPENAI_API_KEY=your-openai-key-goes-here-1234' })).toEqual([]);
  });

  it("flags any mention of Silver in docs, code and names", () => {
    expect(check({ ...base, "README.md": "# My Silver project\n\n![demo](demo.gif)\n\nRun `docker compose up`." })).toEqual(["SILVER_REFERENCE"]);
    expect(check({ ...base, "docs/adr.md": "Built for the Silver process." })).toEqual(["SILVER_REFERENCE"]);
    expect(check({ ...base, "src/seed.ts": "bcrypt.hashSync('silver', 10)", "package.json": '{ "name": "silver-demo" }' })).toEqual(["SILVER_REFERENCE", "SILVER_REFERENCE"]);
    expect(check({ ...base, "src/seed.go": '"Silverado", "Quicksilvery"', ".gitignore": "# RIA/Silverlight projects", "drizzle/meta/_journal.json": '"tag": "0003_brave_silver_panther"' })).toEqual([]);
  });

  it("treats installed agent skills as AI tool config", () => {
    expect(check({ ...base, ".agents/skills/shadcn/SKILL.md": "" })).toEqual(["AI_TOOL_CONFIG"]);
  });

  it("flags a file the README copies that isn't in the zip", () => {
    expect(check({ ...base, "README.md": readme["README.md"] + "\n\n```sh\ncp .env.example .env\n```" })).toEqual(["NOTES_OUTSIDE_SUBMISSION"]);
    expect(check({ ...base, "README.md": readme["README.md"] + "\n\n```sh\ncp .env.example .env\n```", ".env.example": "PORT=3000" })).toEqual([]);
  });

  it("says when a referenced file ships at another path", async () => {
    const { runCodeChecks } = await import("@/takehome-checker/utils");
    const files = { ...base, "README.md": readme["README.md"] + "\n\n```sh\n./app --input data/items.json\n```", "app/items.json": "[]" };
    const list = Object.entries(files).map(([path, content]) => ({ path, size: content.length }));
    const notes = runCodeChecks({ root: "", files: list, readmePath: "README.md", readme: files["README.md"] }, (path) => files[path as keyof typeof files]).map(({ note }) => note);
    expect(notes).toContain("data/items.json is not at that path (the file is at app/items.json)");
  });
});

describe("hostingUrlPattern", () => {
  it("recognizes hosted demos but not repositories or local servers", () => {
    expect(hostingUrlPattern.test("`https://my-service-production.up.railway.app` runs this image")).toBe(true);
    expect(hostingUrlPattern.test("Demo: https://my-app.vercel.app/")).toBe(true);
    expect(hostingUrlPattern.test("https://github.com/me/app and http://localhost:3000")).toBe(false);
  });
});

describe("scoreFor", () => {
  it("says no from one red flag or two yellow flags, strong no from two red flags", () => {
    const flag = (color: "red" | "yellow") => ({ id: color, title: "", color, feedback: "", evidence: [] });
    expect(scoreFor([])).toBe("Strong yes");
    expect(scoreFor([flag("yellow")])).toBe("Yes");
    expect(scoreFor([flag("yellow"), flag("yellow")])).toBe("No");
    expect(scoreFor([flag("red")])).toBe("No");
    expect(scoreFor([flag("red"), flag("red")])).toBe("Strong no");
  });
});

describe("ratingReason", () => {
  it("says what to fix for the next rating", () => {
    const flag = (color: "red" | "yellow", title: string) => ({ id: title, title, color, feedback: "", evidence: [] });
    expect(ratingReason([])).toBeUndefined();
    expect(ratingReason([flag("yellow", "Tests")])).toBe("1 worth fixing: Yes. Fix “Tests” for a Strong yes.");
    expect(ratingReason([flag("red", "Setup steps"), flag("yellow", "Tests"), flag("yellow", "Docker")])).toBe(
      "1 must fix and 2 worth fixing: No. Fix “Setup steps” and 1 of the 2 worth fixing for a Yes.",
    );
  });
});

describe("isBaseCode", () => {
  it("keeps product source and drops tests, configs and tooling", () => {
    expect(["app/services/main.py", "web/src/App.tsx", "internal/services/page.go", "src/main.ts"].every(isBaseCode)).toBe(true);
    expect(
      ["tools/refresh.py", "tests/unit/test_utils.py", "web/src/App.test.tsx", "web/vite.config.ts", "tests/fixtures/users.json", "scripts/seed.ts", "conftest.py", "web/src/setupTests.ts"].some(isBaseCode),
    ).toBe(false);
  });
});

describe("testFilePattern", () => {
  it("recognizes Django tests.py and .NET test projects, not source that only mentions test", () => {
    expect(["tests.py", "app/tests.py", "Core_Tests/Cases.cs", "api.test/handler.go"].every((path) => testFilePattern.test(path))).toBe(true);
    expect(["src/contest.py", "src/latest/view.ts", "src/attestation.ts"].some((path) => testFilePattern.test(path))).toBe(false);
  });
});

describe("seedPathPattern", () => {
  it("recognizes shipped sample inputs and mock servers", () => {
    expect(["input.bin", "example inputs/bad.bin", "mock-api/server.js", "prisma/seed.ts", "data/products.json"].every((path) => seedPathPattern.test(path))).toBe(true);
    expect(["src/components/inputs/text-field.tsx", "src/app.ts", "src/input-reader.ts"].some((path) => seedPathPattern.test(path))).toBe(false);
  });
});

describe("runCodeChecks generated files and badges", () => {
  it("ignores the AGENTS.md and CLAUDE.md that create-next-app writes", () => {
    expect(
      check({ ...readme, "AGENTS.md": "<!-- BEGIN:nextjs-agent-rules -->\n# This is NOT the Next.js you know\n<!-- END:nextjs-agent-rules -->", "CLAUDE.md": "@AGENTS.md\n" }),
    ).toEqual([]);
    expect(check({ ...readme, "CLAUDE.md": "Always use pnpm. Never touch the api folder." })).toEqual(["AI_TOOL_CONFIG"]);
  });

  it("ignores badge links to the repo root and placeholder example lines", () => {
    expect(
      check({ ...readme, "README.md": readme["README.md"] + "\n[![status](badge.svg)](./)\n\n```bash\ndocker run -v /absolute/host/path:/data app --input other.env\n```", "badge.svg": "" }),
    ).toEqual([]);
  });
});

describe("inspectZip", () => {
  const readmeText = "# App\n\nA small service that lists products. Run it with `npm install` and `npm start`, then open http://localhost:3000. It reads its data from data/products.json and needs no keys or extra setup to try it locally.";

  it("lists every file, fast-rejects heavy content, and keeps only text", async () => {
    const { zipSync, unzipSync, strToU8 } = await import("fflate");
    const { inspectZip } = await import("@/takehome-checker/utils");
    const archive = zipSync({
      "app/README.md": strToU8(readmeText),
      "app/src/index.ts": strToU8("export {}"),
      "app/node_modules/react/index.js": new Uint8Array(2_000_000),
      "app/src/__pycache__/index.cpython-312.pyc": new Uint8Array(10),
      "app/demo.mp4": new Uint8Array(2_000_000),
      "app/backup.tar": new Uint8Array(2_000_000),
      "app/screenshot.png": new Uint8Array(6_000_000),
      "app/backend/tmp/cache/bootsnap/compile": new Uint8Array(2_000_000),
      "app/public/intro.mp4": new Uint8Array(10),
      "app/logo.png": new Uint8Array(10),
    });
    const { files, upload, problems, readmePath, readText } = inspectZip(archive);
    expect(files.map(({ path }) => path)).toContain("src/index.ts");
    expect(readmePath).toBe("README.md");
    expect(readText("README.md")).toBe(readmeText);
    expect(problems.map(({ reason, path }) => `${reason}:${path}`)).toEqual(["dependencies:node_modules", "dependencies:backend/tmp/cache", "heavy:backup.tar"]);
    expect(Object.keys(unzipSync(upload)).sort()).toEqual(["README.md", "src/index.ts"]);
  });

  it("leaves the largest files out of an upload that is too large, never the README", async () => {
    const { zipSync, unzipSync, strToU8 } = await import("fflate");
    const { inspectZip } = await import("@/takehome-checker/utils");
    const { uploadBytes } = await import("@/takehome-checker/constants");
    const noise = (size: number) => {
      const bytes = new Uint8Array(size);
      for (let start = 0; start < size; start += 65_536) crypto.getRandomValues(bytes.subarray(start, start + 65_536));
      return bytes;
    };
    const archive = zipSync({
      "app/README.md": noise(450_000),
      "app/src/index.ts": strToU8("export {}"),
      ...Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`app/data/part-${index}.json`, noise(400_000 + index)])),
    });
    const { upload, skipped, problems } = inspectZip(archive);
    expect(problems).toEqual([]);
    expect(upload.byteLength).toBeLessThanOrEqual(uploadBytes);
    expect(skipped.map(({ path }) => path)).toEqual(["data/part-9.json", "data/part-8.json"]);
    expect(Object.keys(unzipSync(upload))).toEqual(expect.arrayContaining(["README.md", "src/index.ts"]));
  });

  it("fast-rejects a zip without a README", async () => {
    const { zipSync, strToU8 } = await import("fflate");
    const { inspectZip } = await import("@/takehome-checker/utils");
    expect(inspectZip(zipSync({ "app/index.js": strToU8("1") })).problems).toEqual([{ reason: "no-readme" }]);
  });

  it("fast-rejects a README that's only a title and a zip with no source code", async () => {
    const { zipSync, strToU8 } = await import("fflate");
    const { inspectZip } = await import("@/takehome-checker/utils");
    expect(inspectZip(zipSync({ "app/README.md": strToU8("# App\n\n## Setup"), "app/index.js": strToU8("1") })).problems).toEqual([{ reason: "short-readme", path: "README.md" }]);
    expect(inspectZip(zipSync({ "app/README.md": strToU8(readmeText), "app/service.jar": strToU8("1") })).problems).toEqual([{ reason: "no-source" }]);
  });
});
