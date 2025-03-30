import { Octokit } from "octokit";

interface GitCommit {
  message: string;
  author: {
    name: string;
    date: string;
  };
}

interface FileEntry {
  path: string;
}

export async function fetchReadme(owner: string, repo: string, octokit: Octokit): Promise<string | null> {
  try {
    const { data } = await octokit.request(`GET /repos/${owner}/${repo}/contents/README.md`, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
    });

    return data?.content ? Buffer.from(data.content, "base64").toString("utf-8") : null;
  } catch (error) {
    console.error("Error fetching README:", error);
    return '### No Readme'
  }
}

const repoFilesCache = new Map<string, { files: string[]; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000;

export async function fetchRepoFiles(owner: string, repo: string, octokit: Octokit): Promise<string[]> {
  const cacheKey = `${owner}/${repo}`;
  const cachedData = repoFilesCache.get(cacheKey);
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.files;
  }

  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1",
    { owner, repo }
  );

  const files = response.data.tree.map((entry: FileEntry) => entry.path);

  repoFilesCache.set(cacheKey, { files, timestamp: now });

  return files;
}

const fileContentCache = new Map<string, { content: string; timestamp: number }>();

export async function fetchFileContent(
  owner: string,
  repo: string,
  file: string,
  octokit: Octokit
): Promise<string> {
  const cacheKey = `${owner}/${repo}/${file}`;
  const cachedData = fileContentCache.get(cacheKey);
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.content;
  }

  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: file,
    });

    let content = "";

    if (Array.isArray(response.data)) {
      const firstFile = response.data.find(entry => entry.type === "file");
      if (!firstFile || !firstFile.download_url) {
        throw new Error(`No file found in directory: ${file}`);
      }

      const fileResponse = await fetch(firstFile.download_url);
      content = await fileResponse.text();
    } else {
      content = Buffer.from((response.data as {content: string}).content, "base64").toString("utf-8");
    }

    fileContentCache.set(cacheKey, { content, timestamp: now });

    return content;
  } catch (error) {
    console.error(`Error fetching file ${file}:`, error);
    throw new Error(`Failed to fetch file: ${file}`);
  }
}

export async function fetchRelevantFiles(owner: string, repo: string, octokit: Octokit) {
  const allFiles = await fetchRepoFiles(owner, repo, octokit);

  return allFiles.filter(file =>
    file.match(/(index\.tsx?|server\.ts|routes\/|controllers\/|components\/|App\.tsx?|package\.json)/)
  );
}

export async function fetchGitHistory(owner: string, repo: string, octokit: Octokit): Promise<{
  message: string;
  author: string;
  date: string;
}[]> {
  const { data } = await octokit.request(`GET /repos/${owner}/${repo}/commits`, {
    per_page: 30,
  });

  return data.map((item: { commit: GitCommit }) => ({
    message: item.commit.message,
    author: item.commit.author.name,
    date: item.commit.author.date,
  }));
}
