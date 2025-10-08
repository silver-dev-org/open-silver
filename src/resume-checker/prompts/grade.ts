import { TYPST_TEMPLATE_URL } from "@/resume-checker/utils";
import { GenerateObjectResult, ModelMessage } from "ai";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export type ResponseData = z.infer<typeof ResponseSchema>;

export const ResponseSchema = z.object({
  grade: z.enum(["S", "A", "B", "C"]),
  red_flags: z.array(z.string()),
  yellow_flags: z.array(z.string()),
});

const sResponse: ResponseData = {
  grade: "S",
  yellow_flags: [],
  red_flags: [],
};

const aResponse: ResponseData = {
  grade: "A",
  yellow_flags: [
    "Incluir tecnologías en el título o subtítulo del CV, lo que hace que parezca relleno.",
    "Usar un correo en Hotmail, proyecta una imagen anticuada.",
    "Incluir el domicilio completo en el CV; basta con mencionar ciudad y país si es relevante.",
    `Formato y diseño: El CV parece no seguir el estilo recomendado para Estados Unidos (como Latex o un generador similar), lo que puede restarle profesionalismo. Usá el [template de silver.dev](${TYPST_TEMPLATE_URL}).`,
  ],
  red_flags: [
    "Incluir la fecha de nacimiento, es innecesario y puede dar lugar a sesgos.",
    "Incluir detalles irrelevantes ('fluff') en la sección de Mercado Libre, lo que hace que el CV sea menos conciso y directo.",
  ],
};

const bResponse: ResponseData = {
  grade: "B",
  yellow_flags: [
    "La sección de habilidades es extensa y poco específica. Te recomiendo que la ajustes a la descripción del puesto al que te postulás, incluyendo las habilidades más relevantes y omitiendo las menos importantes o redundantes.",
    "Se menciona 'AWS' dos veces en la sección de habilidades, lo cual puede percibirse como un descuido o falta de organización.",
    "Mencionás que tus estudios universitarios están incompletos. Si bien no es un impedimento, te recomiendo que no lo hagas.",
    "El proyecto 'MercadoCat' podría detallarse un poco más. Describí las tecnologías que usaste, el impacto que tuvo y cualquier otro detalle relevante que demuestre tus habilidades y experiencia.",
  ],
  red_flags: [
    "En la sección 'Acerca de', podrías mencionar tus logros y cómo estos se alinean con las necesidades de la empresa a la que te postulás. Palabras como 'proactive', 'smart' y 'opportunities to grow' no demuestran nada, tenés que demostrar que sos el candidato que la empresa quiere.",
    "Las experiencias listadas en el CV no especifican logros concretos, métricas o resultados obtenidos en los proyectos. Sería ideal incluir métricas que reflejen impacto, como 'mejoré el tiempo de carga en un X%' o 'aumenté la eficiencia del backend en un Y%.'",
    "Inconsistencia en el uso del inglés: En la sección de 'EXPERIENCE' hay errores menores de inglés, como 'Particpated' en lugar de 'Participated'. Esto puede afectar la impresión profesional y dar una apariencia de falta de atención al detalle.",
  ],
};

const cResponse: ResponseData = {
  grade: "C",
  red_flags: [
    `Formato y diseño: El CV parece no seguir el estilo recomendado para Estados Unidos (como Latex o un generador similar), lo que puede restarle profesionalismo. Usá el [template de Silver.dev](${TYPST_TEMPLATE_URL}).`,
    "Posible uso de Word u otro procesador anticuado: Si el CV fue hecho en Word o con un formato que no luce profesional, puede ser un motivo de rechazo en algunos casos.",
    "Uso de imágenes: Las empresas en Estados Unidos consideran inapropiado incluir imágenes en el CV, ya que esto no es estándar y puede generar una percepción negativa.",
    "Representación de habilidades en porcentajes: Mostrar habilidades con porcentajes es desaconsejable, ya que no comunica de manera clara el nivel real de competencia y puede dar lugar a malinterpretaciones. Se prefiere un formato que indique los conocimientos y experiencia de forma descriptiva.",
  ],
  yellow_flags: [],
};

export function getSysPrompt(author?: string) {
  const isSilver = author === "silver";
  return `
# Identity
You are a career coach and expert recruiter with extensive experience reviewing and analyzing resumes.

# Context
You will receive a resume in PDF format and your task is to evaluate its content, format, and impact on the job applicant. You will provide constructive feedback, including:
- A grade from C (worst) to S (best), where S is reserved for an exceptionally good resume
- Specific suggestions for improvement in the format of red and yellow flags, where red flags are very bad signals and yellow flags are a bit less serious.

## Important details
- Assume that today is ${new Date().toLocaleString("en-us", { year: "numeric", month: "long", day: "numeric" })}.

# Instructions
## Guide
- Format
  - Use a template
    - Google Docs has a good starter template that's easy to use and aesthetically pleasing
    - Companies in the USA like Latex-style resumes, you can use a Latex-style builder like Typst and use the [Silver.dev template](${TYPST_TEMPLATE_URL}).
  - Creative designs and resumes submitted in Word lower the quality of your resume and can even be grounds for rejection.
  - It must be one page only.
- Main content
  - Edit your resume according to the company you're sending it to:
    - Look at LinkedIn profiles of people who work at the company and copy them, these are the "winners".
    - Change position titles, content, messaging, and skills to try to better match what the company is looking for.
    - You want to tell a story that highlights the main strengths of your profile.
  - [Recommended] Add an introduction or "about" section that you customize for each company.
    - This introduction should answer explicitly or implicitly the question "Why should XXX company hire me".
  - Don't include images or profile photos. This is taboo for companies in the USA.
  - Every time you edit the content, run it through Grammarly - typos on resumes are unacceptable.
- What you shouldn't do
  - Create your own templates or use outdated tools like Word.
  - Avoid "spray & pray" strategies (using the same generic resume indiscriminately for all your applications).
  - Add images and photos.
  - Have more than one page.
  - Use a @hotmail email address.
  - Write the resume in Spanish.
  - Have spelling errors.

## Guide clarifications
- Don't use your own opinion; use the provided guidelines.
- NEVER say using Gmail is wrong
${isSilver ?? "- Do NOT mention ANYTHING regarding the template"}
- Don't comment on things you're not 100% sure about. Don't assume anything from the resume that isn't in it.
- The location of the candidate's past jobs doesn't matter; don't mention it as a shortcoming or a "flag".
- The answer should be in the second person, so instead of talking "about the candidate" (in the third person), communicate directly with the candidate to give them advice.
- The answer should be in Argentine/Rio de la Plata Spanish; don't use words like "debes" or "incluyes," but rather "tenés" or "incluís."

## Non-flags
Examples of things that are NOT red or yellow flags and that you don't have to include in your answer:
- Although you mention the start and end dates for each experience, you don't specify whether the positions were full-time or part-time. If they were full-time, I recommend clarifying this to avoid confusion.
- Including information about your online community on your resume is not relevant to most companies in the United States. It is recommended that you remove it to maintain the focus on your professional experience and skills relevant to the position.
- There is no reverse chronological order for work experience. Always list your work experiences from most recent to oldest to make it easier for recruiters to read. (Candidates sometimes have multiple experiences at the same time.)
- There are some minor formatting and style errors that should be corrected for a better presentation. For example, the use of "/" in dates and the lack of consistency in punctuation.
- There is no mention of experience with agile methodologies or teamwork, which is highly valued in today's market. If you have experience in these areas, include it in your resume.
- The email uses a public domain like Gmail. It's preferable to use your own domain or a more professional one for a better image.
- The CV file name doesn't follow a professional format. It's recommended to use a format like 'FirstNameLastName-CV.pdf'.
- Having dates like '2019 - 2021' and '2021 - current' is redundant. You can simplify it to '2019-2021' and '2021-Present'.

# Response
You MUST follow the exact format and constraints specified below.

## Format
\`\`\`json
{
  "grade": 'S' | 'A' | 'B' | 'C',
  "red_flags": string[],
  "yellow_flags": string[],
}
\`\`\`

## Constraints
- \`red_flags\` and \`yellow_flags\` must have a maximum of 280 characters.
`;
}

function createAssistantResponse(response: ResponseData): ModelMessage {
  return {
    role: "assistant",
    content: JSON.stringify(response),
  };
}

function createInput(data: Buffer): ModelMessage {
  return {
    role: "user",
    content: [
      {
        type: "file",
        data,
        mediaType: "application/pdf",
      },
    ],
  };
}

/* Moving the fs.readFileSync call deeper causes an error when reading files */
export function messages(
  parsed: { text: string; info?: any },
  pdfBuffer: Buffer,
): ModelMessage[] {
  const trainMessages: ModelMessage[] = [
    {
      data: fs.readFileSync(path.join(process.cwd(), "public/s_resume.pdf")),
      response: sResponse,
    },
    {
      data: fs.readFileSync(path.join(process.cwd(), "public/a_resume.pdf")),
      response: aResponse,
    },
    {
      data: fs.readFileSync(path.join(process.cwd(), "public/b_resume.pdf")),
      response: bResponse,
    },
    {
      data: fs.readFileSync(path.join(process.cwd(), "public/c_resume.pdf")),
      response: cResponse,
    },
  ].flatMap(({ data, response }) => [
    createInput(data),
    createAssistantResponse(response),
  ]);

  return [
    { role: "system", content: getSysPrompt(parsed?.info?.Author) },
    ...trainMessages,
    createInput(pdfBuffer),
  ];
}

function hasGmail(flag: string) {
  const r = new RegExp(/gmail/i);
  return r.test(flag);
}

function hasHotmail(flag: string) {
  const r = new RegExp(/hotmail/i);
  return r.test(flag);
}

/**
 * Remove the gmail flag if hotmail is not mentioned to avoid cases like
 * "Don't use hotmail, use gmail"
 */
function removeGmailFlag(data: ResponseData) {
  const idxR = data.red_flags.findIndex((f) => !hasHotmail(f) && hasGmail(f));
  const idxY = data.yellow_flags.findIndex(
    (f) => !hasHotmail(f) && hasGmail(f),
  );

  if (idxR !== -1) {
    data.red_flags = data.red_flags.splice(idxR, 1);
  }

  if (idxY !== -1) {
    data.yellow_flags = data.yellow_flags.splice(idxY, 1);
  }
}

export function sanitizeCompletion(
  completion: GenerateObjectResult<ResponseData>,
): ResponseData {
  const data = { ...completion.object };

  removeGmailFlag(data);

  return data;
}

export const exampleResponses = new Map([
  ["public/s_resume.pdf", sResponse],
  ["public/a_resume.pdf", aResponse],
  ["public/b_resume.pdf", bResponse],
  ["public/c_resume.pdf", cResponse],
]);
