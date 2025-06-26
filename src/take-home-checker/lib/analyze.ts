import { analyzeText } from "@/take-home-checker/lib/openai";
import { AnalysisResult } from "@/take-home-checker/types/repo";
import { Octokit } from "octokit";
import { fetchFileContent, fetchReadme, fetchRelevantFiles } from "./github";
import { codeEvaluationPrompt, readmeEvaluationPrompt } from "./prompts";
import { extractJsonFromString } from "./utils";

export async function analyzeReadme(
  owner: string,
  repo: string,
  octokit: Octokit
) {
  const readmeContent = await fetchReadme(owner, repo, octokit);

  if (!readmeContent) {
    return { message: "README.md no encontrado en el repositorio." };
  }

  const prompt = readmeEvaluationPrompt.replace("${content}", readmeContent);

  const analysis = await analyzeText(prompt);
  return { analysis, content: readmeContent };
}

export async function analyzeCodeQuality(
  owner: string,
  repo: string,
  octokit: Octokit
) {
  const relevantFiles = await fetchRelevantFiles(owner, repo, octokit);

  const fileContents = await Promise.all(
    relevantFiles.map(async (file) => ({
      file,
      content: await fetchFileContent(owner, repo, file, octokit),
    }))
  );

  const content = fileContents
    .map((f) => `**${f.file}**\n\`\`\`\n${f.content.slice(0, 1000)}...\n\`\`\``)
    .join("\n\n");

  const prompt = codeEvaluationPrompt.replace("${content}", content);

  const analysis = await analyzeText(prompt);
  return { analysis };
}

export async function analyzeRepository(
  owner: string,
  repo: string,
  octokit: Octokit
) {
  const [readmeAnalysis, codeQualityAnalysis] = await Promise.all([
    analyzeReadme(owner, repo, octokit),
    analyzeCodeQuality(owner, repo, octokit),
  ]);

  const prompt = `
    Basado en los siguientes análisis del repositorio, proporciona una calificación final y feedback detallado. Utiliza los estándares de calificación de Silicon Valley para startups.

    Análisis de README:
    ${readmeAnalysis.analysis}

    Análisis del code quality del proyecto:
    ${codeQualityAnalysis.analysis}

    Criterios de evaluación:
    - **Strong Yes**: Proyecto excepcional que destaca significativamente
    - **Yes**: Proyecto sólido que cumple con los requisitos
    - **No**: Proyecto con problemas significativos
    - **Strong No**: Proyecto con problemas críticos

    Devuelve la respuesta como un objeto JSON con la siguiente estructura:
    {
      "score": "strong-no" | "no" | "yes" | "strong-yes",
      "documentationFeedback": {
        "green": ["Lista de aspectos positivos de la documentación"],
        "yellow": ["Lista de áreas de mejora en la documentación"],
        "red": ["Lista de problemas críticos en la documentación"]
      },
      "codeFeedback": {
        "green": ["Lista de aspectos positivos del código"],
        "yellow": ["Lista de áreas de mejora en el código"],
        "red": ["Lista de problemas críticos en el código"]
      },
      "prompts": {
        "documentation": "Analyze the documentation quality of this repository. Look at README files, inline comments, API documentation, and overall project structure documentation. Rate the clarity, completeness, and helpfulness of the documentation.",
        "code": "Evaluate the code quality of this repository. Consider factors like code organization, best practices adherence, error handling, testing coverage, performance considerations, and maintainability. Provide specific feedback on areas of strength and improvement."
      }
    }
  `;

  const finalAnalysis = await analyzeText(prompt);
  const parsedAnalysis = extractJsonFromString(finalAnalysis) as AnalysisResult;

  const all = {
    content: readmeAnalysis.content,
    analysis: parsedAnalysis,
  };

  return all;
}
