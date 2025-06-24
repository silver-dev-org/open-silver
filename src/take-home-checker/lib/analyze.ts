import { analyzeText } from "@/take-home-checker/lib/openai";
import { Octokit } from "octokit";
import { fetchFileContent, fetchReadme, fetchRelevantFiles } from "./github";
import { extractJsonFromString } from "./utils";
import { readmeEvaluationPrompt, codeEvaluationPrompt } from "./prompts";

export async function analyzeReadme(
  owner: string,
  repo: string,
  octokit: Octokit,
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
  octokit: Octokit,
) {
  const relevantFiles = await fetchRelevantFiles(owner, repo, octokit);

  const fileContents = await Promise.all(
    relevantFiles.map(async (file) => ({
      file,
      content: await fetchFileContent(owner, repo, file, octokit),
    })),
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
  octokit: Octokit,
) {
  const [readmeAnalysis, codeQualityAnalysis] = await Promise.all([
    analyzeReadme(owner, repo, octokit),
    analyzeCodeQuality(owner, repo, octokit),
  ]);

  const prompt = `
    Basado en los siguientes análisis del repositorio, proporciona una calificación final (Strong No,No, Yes, Strong Yes), un resumen y destaca las banderas rojas, amarillas y verdes si es aplicable. Utiliza los estándares de calificación de Silicon Valley para startups.

    Análisis de README:
    ${readmeAnalysis.analysis}

    Análisis del code quality del proyecto:
    ${codeQualityAnalysis.analysis}

    Criterios de Bandera Verde (aspectos positivos):
    💯 **Desafíos take-home excepcionales**
    Las entregas excepcionales son aquellas memorables para los entrevistadores. Las van a recordar mucho tiempo después de que se hayan hecho porque se destacan entre las demás.
    Las entregas que impresionan evidencian excelentes rasgos como experiencia, creatividad, intuición e ingenio.

    Yellow Flag Criteria (slightly negative findings):
    The takehome is almost entirely AI generated. It is minimalistic, and has naive or unsophisticated approaches to fulfill requirements.

    Criterios de Bandera Roja (problemas críticos):
    - Stack tecnológico obsoleto o dependencias faltantes.
    - Documentación pobre o inexistente, lo que dificulta la prueba o despliegue del proyecto.
    - Errores importantes que rompen la funcionalidad.
    - It is lazy; it does the bare minimum and cuts corners all the time.

    Devuelve la respuesta como un objeto JSON con la siguiente estructura:
    {
      "grade": "Strong No | No | Yes | Strong Yes",
      "summary": "A short gist about the challenge quality",
      "redFlags": [], // si hay lista los problemas criticos en este array
      "yellowFlags": [],// si hay lista los problemas menores en este array
      "greenFlags": [], si hay lista los aspectos excepcionales en este array
    }
  `;

  const finalAnalysis = await analyzeText(prompt);
  const all = {
    content: readmeAnalysis.content,
    analysis: extractJsonFromString(finalAnalysis),
  };

  return all;
}
