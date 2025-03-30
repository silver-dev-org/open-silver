import { analyzeText } from "@/take-home-checker/lib/openai";
import { Octokit } from "octokit";
import { fetchFileContent, fetchGitHistory, fetchReadme, fetchRelevantFiles, fetchRepoFiles } from "./github";
import { extractJsonFromString } from "./utils";

export async function analyzeReadme(owner: string, repo: string, octokit: Octokit) {
  const readmeContent = await fetchReadme(owner, repo, octokit);

  if (!readmeContent) {
    return { message: "README.md no encontrado en el repositorio." };
  }

  const prompt = `
  Analiza el siguiente archivo README para buenas prácticas y proporciona un **resumen conciso** considerando los siguientes aspectos:

  1️⃣ **Stack Tecnológico**: ¿El stack tecnológico está claramente mencionado? ¿Es moderno y relevante?
  2️⃣ **Instalación y Uso**: ¿Existen instrucciones claras para instalar, ejecutar y probar el proyecto? ¿Se mencionan las dependencias y sus versiones?
  3️⃣ **Despliegue y Accesibilidad**: ¿Menciona si el proyecto está desplegado o cómo probarlo fácilmente? ¿Existen pasos claros para el despliegue si aplica?
  4️⃣ **Decisiones Técnicas**: ¿Explica las decisiones clave tomadas (como por qué se utilizaron ciertas bibliotecas o frameworks)?
  5️⃣ **Pruebas**: ¿Incluye detalles sobre pruebas (manuales o automatizadas)? ¿Se menciona alguna herramienta o cobertura para las pruebas?
  6️⃣ **Cumplimiento de Requerimientos**: ¿Define claramente los objetivos y funcionalidades esperadas? ¿Se cumplen los requisitos y existe un plan claro para verificar la solución? **Limita la respuesta a 3-5 puntos, evitando detalles excesivos.**

  ** ⚠️ Limita la respuesta a 3-5 puntos, evitando detalles excesivos.**

  Contenido del README:
  ${readmeContent}
`;

  const analysis = await analyzeText(prompt);
  return { analysis, content: readmeContent }
}

export async function analyzeProjectStructure(owner: string, repo: string, octokit: Octokit) {
  const allFilePaths = await fetchRepoFiles(owner, repo, octokit);

  if (allFilePaths.length === 0) {
    return { message: "No se pudo obtener la estructura del proyecto o el repositorio está vacío." };
  }

  const prompt = `
    Evalúa la siguiente estructura del proyecto y determina si sigue las mejores prácticas para un desafío técnico y proporciona un **resumen conciso** considerando los siguientes aspectos:

    1️⃣ **Organización de Carpetas y Archivos**: ¿Los archivos y carpetas están bien estructurados según las convenciones comunes del proyecto? ¿Hay archivos redundantes o faltantes? Por ejemplo, ¿hay una separación clara entre el código fuente, los assets y los archivos de configuración?
    2️⃣ **Calidad del Código y Legibilidad**: ¿Existen separaciones claras entre las distintas partes del proyecto (por ejemplo, componentes, utilidades, pruebas)? ¿Se sigue una convención de nombres y estructura de carpetas consistente para los módulos?

    ** ⚠️ Limita la respuesta evitando detalles excesivos.**

    **Estructura del Proyecto:**
    ${allFilePaths.join("\n")}
  `;

  const analysis = await analyzeText(prompt);
  return { analysis }
}

export async function analyzeGitHistory(owner: string, repo: string, octokit: Octokit) {
  const gitHistory = await fetchGitHistory(owner, repo, octokit);

  if (gitHistory.length === 0) {
    return { message: "No se encontraron commits en el repositorio." };
  }

  const prompt = `
  Analiza el historial de commits de Git para buenas prácticas. Proporciona un **resumen breve** de los siguientes aspectos:

    1️⃣ **Mensajes de Commit**: ¿Son los mensajes de commit claros, concisos y significativos? ¿Siguen un formato consistente?
    2️⃣ **Desarrollo Basado en Pruebas y Características**: ¿Los mensajes de commit indican trabajo en características o pruebas específicas?
    3️⃣ **Commits Atómicos**: ¿Son los commits atómicos, es decir, cada commit aborda una tarea o característica única, lo que facilita su comprensión y revisión?
    4️⃣ **Refactorización de Código y Formato**: ¿Reflejan los mensajes de commit cambios de refactorización de código o formato que mejoren la legibilidad, organización o mantenibilidad?

    ** ⚠️ Limita la respuesta evitando detalles excesivos.**

    **Historial de Commits de Git:**
    ${gitHistory.map(commit => `- ${commit.date}: ${commit.message} por ${commit.author}`).join("\n")}
  `;

  const analysis = await analyzeText(prompt);
  return { analysis }
}

export async function analyzeCodeQuality(owner: string, repo: string, octokit: Octokit) {
  const relevantFiles = await fetchRelevantFiles(owner, repo, octokit);

  const fileContents = await Promise.all(
    relevantFiles.map(async file => ({
      file,
      content: await fetchFileContent(owner, repo, file, octokit)
    }))
  );

  const prompt = `
    Analiza los siguientes archivos de código en busca de **buenas prácticas**.
    
    - ¿Se siguen los patrones correctos(idioms) para React y TypeScript?
    - ¿Se identifican code smells o patrones incorrectos?
    - ¿El código es modular y reutilizable?
    - ¿Se detectan posibles bugs?

    Archivos:
    ${fileContents.map(f => `**${f.file}**\n\`\`\`\n${f.content.slice(0, 1000)}...\n\`\`\``).join("\n\n")}
  `;

  const analysis = await analyzeText(prompt);
  return { analysis }
}


export async function analyzeRepository(owner: string, repo: string, octokit: Octokit) {
  const [readmeAnalysis, codeQualityAnalysis, gitHistoryAnalysis, structureAnalysis] = await Promise.all([
    analyzeReadme(owner, repo, octokit),
    analyzeCodeQuality(owner, repo, octokit),
    analyzeGitHistory(owner, repo, octokit),
    analyzeProjectStructure(owner, repo, octokit),
  ]);

  const prompt = `
    Basado en los siguientes análisis del repositorio, proporciona una calificación final (S, A, B, C, D), un resumen y destaca las banderas rojas, amarillas y verdes si es aplicable. Utiliza los estándares de calificación de Silicon Valley para startups.

    Análisis de README:
    ${readmeAnalysis.analysis}

    Análisis del code quality del proyecto:
    ${codeQualityAnalysis.analysis}
    
    Análisis de la estructura del proyecto:
    ${structureAnalysis.analysis}
    
    Análisis del historial de Git:
    ${gitHistoryAnalysis.analysis}
    
    Por favor, evalúa:
    1️⃣ Calidad general del repositorio, considerando la tecnología más reciente, escalabilidad e innovación.
    2️⃣ Identifica cualquier problema crítico (banderas rojas), menor (banderas amarillas) y aspectos positivos (banderas verdes).
    3️⃣ Proporciona una calificación final según los estándares de Silicon Valley:
       - **S (Excepcional)**: Repositorio sobresaliente, cumple con todos los criterios a un nivel alto, escalable, innovador y sin errores.
       - **A (Fuerte)**: Repositorio de alta calidad con problemas menores o áreas de mejora.
       - **B (Bueno)**: Cumple con la mayoría de los criterios, pero tiene problemas notables, requiere mejoras para obtener una calificación más alta.
       - **C (Justo)**: Aceptable, pero falla en áreas significativas como escalabilidad o elecciones tecnológicas.
       - **D (Pobre)**: Problemas importantes con el repositorio, incluidos errores, mala arquitectura o falta de características clave.
    4️⃣ Resume el análisis y justifica la calificación.

    Criterios de Bandera Verde (aspectos positivos):
    💯 **Desafíos take-home excepcionales**
    Las entregas excepcionales son aquellas memorables para los entrevistadores. Las van a recordar mucho tiempo después de que se hayan hecho porque se destacan entre las demás.
    Las entregas que impresionan evidencian excelentes rasgos como experiencia, creatividad, intuición e ingenio.

    **Checklist General**:
    - **Stack tecnológico seleccionado**: Elegir el stack más actualizado y cercano al cliente.
    - **Historial de Git**: Separar el boilerplate de las contribuciones originales y hacer commits legibles y bien comentados.
    - **Fácil de probar**: Si es posible, deployar el proyecto para que el entrevistador lo pruebe sin instalar nada.
    - **Documentación**: Incluir instrucciones claras y casos de prueba. Asegurarse de que la documentación funcione correctamente.
    - **SIN BUGS**: No deben existir bugs, ya que pueden afectar negativamente la evaluación.
    - **Cumplir con los requerimientos**: Cumplir los requisitos técnicos y del producto de manera precisa.
    - **Velocidad de entrega**: Cumplir con los deadlines o entregar el challenge dentro de un tiempo razonable.
    - **Limitar el uso de Generative AI**: Evitar el uso de IA generativa para comentarios o para realizar la entrega.
    - **Testear el código**: Incluir pruebas que demuestren la capacidad del candidato para testear el código adecuadamente.

    Criterios de Bandera Roja (problemas críticos):
    - Stack tecnológico obsoleto o dependencias faltantes.
    - Documentación pobre o inexistente, lo que dificulta la prueba o despliegue del proyecto.
    - Errores importantes que rompen la funcionalidad.
    - Falta de escalabilidad o deuda técnica en la arquitectura.

    Devuelve la respuesta como un objeto JSON con la siguiente estructura:
    {
      "grade": "S | A | B | C | D",
      "summary": "Un breve resumen del análisis del repositorio.",
      "redFlags": [], // si hay lista los problemas criticos en este array
      "yellowFlags": [],// si hay lista los problemas menores en este array
      "greenFlags": [], si hay lista los aspectos excepcionales en este array
    }
  `;

  const finalAnalysis = await analyzeText(prompt);
  const all = {
    content: readmeAnalysis.content,
    analysis : extractJsonFromString(finalAnalysis)
  }

  return all
}
