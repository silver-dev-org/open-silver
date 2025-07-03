import { App, Octokit } from "octokit";

const fileCacheDuration = 1000 * 60 * 2;
const repoFilesCache = new Map<
  string,
  { files: string[]; timestamp: number }
>();
const fileContentCache = new Map<
  string,
  { content: string; timestamp: number }
>();

export async function getOctokit(installationId: number) {
  const app = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
    oauth: {
      allowSignup: true,
      clientId: process.env.GITHUB_APP_CLIENT_ID!,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
    },
  });
  const octokit = await app.getInstallationOctokit(installationId);
  return octokit;
}

export async function getReadmeContent(octokit: Octokit, repoFullName: string) {
  try {
    const { data } = await octokit.request(
      `GET /repos/${repoFullName}/contents/README.md`
    );
    if (data?.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
  } catch (error) {
    console.error("Error fetching README:", error);
    return;
  }
}

export async function getRepoFilePaths(octokit: Octokit, repoFullName: string) {
  const cachedData = repoFilesCache.get(repoFullName);
  const now = Date.now();
  const isCached = cachedData && now - cachedData.timestamp < fileCacheDuration;
  if (isCached) return cachedData.files;

  const response = await octokit.request(
    `GET /repos/${repoFullName}/git/trees/HEAD?recursive=1`
  );
  const files = response.data.tree.map((entry: { path: string }) => entry.path);
  repoFilesCache.set(repoFullName, { files, timestamp: now });
  return files as string[];
}

export async function getFileContent(
  octokit: Octokit,
  repoFullName: string,
  filePath: string
) {
  const cacheKey = `${repoFullName}/${filePath}`;
  const cachedData = fileContentCache.get(cacheKey);
  const now = Date.now();
  const isCached = cachedData && now - cachedData.timestamp < fileCacheDuration;
  if (isCached) return cachedData.content;

  try {
    const response = await octokit.request(
      `GET /repos/${repoFullName}/contents/${filePath}`
    );

    let content = "";

    if (Array.isArray(response.data)) {
      const firstFile = response.data.find((entry) => entry.type === "file");

      if (!firstFile || !firstFile.download_url) {
        throw new Error(`No file found in directory: ${filePath}`);
      }

      const fileResponse = await fetch(firstFile.download_url);
      content = await fileResponse.text();
    } else {
      content = Buffer.from(
        (response.data as { content: string }).content,
        "base64"
      ).toString("utf-8");
    }

    fileContentCache.set(cacheKey, { content, timestamp: now });

    return content;
  } catch (error) {
    console.error(`Error fetching file ${filePath}:`, error);
    throw error;
  }
}
