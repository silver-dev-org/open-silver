import {
  codeEvaluationPrompt,
  readmeEvaluationPrompt,
} from "@/app/take-home-checker/constants";
import { RepoAnalysis } from "@/app/take-home-checker/types";
import {
  getFileContent,
  getOctokit,
  getReadmeContent,
  getRepoFiles,
} from "@/lib/github";
import { analyzeText } from "@/lib/openai";
import { extractJsonFromString } from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "octokit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { repoFullName, installationId } = req.body;
  try {
    const octokit = await getOctokit(installationId);
    const analysis = await analyzeRepository(repoFullName, octokit);
    res.status(200).json(analysis);
  } catch (error) {
    console.error("Error analyzing project", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function analyzeRepository(
  repoFullName: string,
  octokit: Octokit
): Promise<RepoAnalysis> {
  const [readme, code] = await Promise.all([
    analyzeReadme(octokit, repoFullName),
    analyzeCode(octokit, repoFullName),
  ]);
  const prompt = `Basado en los siguientes análisis del repositorio, proporciona una calificación final y feedback detallado. Utiliza los estándares de calificación de Silicon Valley para startups.

    Análisis de README:
    ${readme.analysis}

    Análisis del código del proyecto:
    ${code.analysis}

    Criterios de evaluación:
    - **Strong Yes**: Proyecto excepcional que destaca significativamente
    - **Yes**: Proyecto sólido que cumple con los requisitos
    - **No**: Proyecto con problemas significativos
    - **Strong No**: Proyecto con problemas críticos

    Devuelve la respuesta como un objeto JSON con la siguiente estructura:
    {
      "score": "Strong no" | "No" | "Yes" | "Strong yes",
      "docs": {
        "green": ["Lista de aspectos positivos de la documentación"],
        "yellow": ["Lista de áreas de mejora en la documentación"],
        "red": ["Lista de problemas críticos en la documentación"]
      },
      "code": {
        "green": ["Lista de aspectos positivos del código"],
        "yellow": ["Lista de áreas de mejora en el código"],
        "red": ["Lista de problemas críticos en el código"]
      },
    }`;
  const rawAnalysis = await analyzeText(prompt);
  return extractJsonFromString(rawAnalysis);
}

export async function analyzeReadme(octokit: Octokit, repoFullName: string) {
  const content = await getReadmeContent(octokit, repoFullName);
  const prompt = readmeEvaluationPrompt.replace(
    "${content}",
    content ?? "No README found"
  );
  const analysis = await analyzeText(prompt);
  return { content, analysis };
}

export async function analyzeCode(octokit: Octokit, repoFullName: string) {
  const allFiles = await getRepoFiles(octokit, repoFullName);
  const relevantFiles = allFiles.filter((file) =>
    file.match(
      // TODO: handle other languages and frameworks
      /(index\.tsx?|server\.ts|routes\/|controllers\/|components\/|App\.tsx?|package\.json)/
    )
  );
  const fileContents = await Promise.all(
    relevantFiles.map(async (file) => ({
      file,
      content: await getFileContent(octokit, repoFullName, file),
    }))
  );
  const content = fileContents
    .map((f) => `**${f.file}**\n\`\`\`\n${f.content.slice(0, 1000)}...\n\`\`\``)
    .join("\n\n");
  const prompt = codeEvaluationPrompt.replace("${content}", content);
  const analysis = await analyzeText(prompt);
  return { content, analysis };
}
