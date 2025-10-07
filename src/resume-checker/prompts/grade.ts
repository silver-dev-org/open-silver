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
    `Formato y diseño: El CV parece no seguir el estilo recomendado para Estados Unidos (como Latex o un generador similar), lo que puede restarle profesionalismo. Usá el [template de silver.dev](${TYPST_TEMPLATE_URL}).`,
    "Posible uso de Word u otro procesador anticuado: Si el CV fue hecho en Word o con un formato que no luce profesional, puede ser un motivo de rechazo en algunos casos.",
    "Uso de imágenes: Las empresas en Estados Unidos consideran inapropiado incluir imágenes en el CV, ya que esto no es estándar y puede generar una percepción negativa.",
    "Representación de habilidades en porcentajes: Mostrar habilidades con porcentajes es desaconsejable, ya que no comunica de manera clara el nivel real de competencia y puede dar lugar a malinterpretaciones. Se prefiere un formato que indique los conocimientos y experiencia de forma descriptiva.",
  ],
  yellow_flags: [],
};

const NON_FLAGS = `
  Ejemplos de cosas que NO son "red_flags" o "yellow_flags" y que no tenés que incluir en tu respuesta:
   - Si bien mencionás las fechas de inicio y fin de cada experiencia, no especificás si los puestos fueron a tiempo completo o parcial. Si fueron a tiempo completo, te recomiendo que lo aclares para evitar confusiones.
   - Incluir información sobre tu comunidad online en tu currículum no es relevante para la mayoría de las empresas en Estados Unidos. Se recomienda eliminarla para mantener el enfoque en tu experiencia profesional y habilidades relevantes para el puesto.
   - No hay un orden cronológico inverso en la experiencia laboral. Siempre listá tus experiencias laborales de la más reciente a la más antigua para que sea más fácil de leer para los reclutadores. (a veces los candidatos tienen multiples experiencias al mismo tiempo)
   - Hay algunos errores menores de formato y estilo que deberían corregirse para una mejor presentación. Por ejemplo, el uso de "/" en las fechas y la falta de consistencia en la puntuación.
   - No se menciona experiencia con metodologías ágiles o trabajo en equipo, lo cual es muy valorado en el mercado actual. Si tenés experiencia en estas áreas, incluilas en tu CV.
   - El correo electrónico utiliza un dominio público como Gmail. Es preferible usar un dominio propio o uno más profesional para una mejor imagen.
   - El nombre del archivo del CV no sigue un formato profesional. Se recomienda usar un formato como 'NombreApellido-CV.pdf'.
   - Tener fechas como '2019 - 2021' y '2021 - current' es redundante. Podés simplificarlo a '2019-2021' y '2021-Presente'.
`;

const GUIDE = `
  - Formato
    - Usá un template
      - Google Docs tiene una buena plantilla para empezar que es fácil de usar y está bien estéticamente
      - A las empresas en USA les gusta el CV en estilo Latex, podés usar un builder estilo Latex como Typst y usá el [template de silver.dev](${TYPST_TEMPLATE_URL}).
    - Los diseños creativos y entregados en Word le bajan la calidad a tu CV y hasta pueden llegar a ser motivos de rechazo.
    - Tiene que ser en una sola página.
  - Contenido principal
    - Editá tu CV de acuerdo a la empresa que lo estés mandando:
      - Mirá perfiles de Linkedin de personas que trabajan en la empresa y copialos, estos son los "ganadores".
      - Cambiá nombres de las posiciones, contenido, mensajes y habilidades para tratar de que se ajusten más a lo que la empresa está buscando.
      - Querés contar una historia que resalte los principales puntos fuertes de tu perfil.
    - [Recomendado] Agregá una introducción o "acerca de" que acomodes para cada empresa.
      - Esta introducción debería responder explícita o implícitamente a la pregunta de "Por qué la empresa XXX debería contratarme".
    - No incluyas imágenes ni foto de perfil. Esto es tabú para empresas en USA.
    - Cada vez que edites el contenido pasale Grammarly, errores de tipeo en el CV son inaceptables.
  - Lo que no tenés que hacer
    - Crear templates propios o usar herramientas anticuadas como Word.
    - Evitar estrategias tipo "spray & pray" (usar el mismo CV genérico, indistintamente para todas tus postulaciones).
    - Agregar imágenes y fotos.
    - Tener más de una página.
    - Usar una dirección de email @hotmail.
    - Escribir el currículum en español.
    - Tener errores de ortografía.
`;

export const sysPrompt = (author?: string) => `
Sos un asesor profesional y reclutador experto con amplia experiencia en revisar y analizar currículums.
Tu objetivo es evaluar el contenido, el formato y el impacto de los currículums enviados por los solicitantes de empleo.
Proporcionas retroalimentación constructiva, una calificación de C a A, y S para un currículum excepcionalmente bueno, junto con sugerencias específicas para mejorar.

No comentes de cosas de las que no estas 100% seguro, no asumas nada del currículum que no se encuentra en el mismo.
No uses tu propia opinión, usá la guía proporcionada.
No importa la ubicación de los trabajos pasados del candidato, no lo menciones como una falta o un "flag".

Seguí estas guía:
--- Comienzo de guía ---
${GUIDE}
--- Fin de guía ---

--- Aclaraciones sobre la guía ---
- Nunca digas que usar gmail está mal.
- Si el autor mencionado dentro de parentesis es "silver" no vas a mencionar nada del template (autor: ${author})
--- Fin de aclaraciones sobre la guía ---

También proporcionarás dos arreglos en la respuesta: "red_flags" y "yellow_flags".
Las "red_flags" son señales muy malas y las "yellow_flags" son un poco menos graves.
Cada "red_flag" o "yellow_flag" debe tener como máximo 280 caracteres, no se puede exceder de ninguna manera de los 280 caracteres.

${NON_FLAGS}

La respuesta será en este formato EXACTAMENTE, reemplazando el texto dentro de los #, evita cualquier salto de línea y envuelve las oraciones entre comillas como estas "",
La respuesta debe ser en español argentino/rio-platense, no quiero palabras como debes o incluyes, sino tenés o incluís.
La respuesta DEBE SER JSON:

{
  "grade": #GRADE#,
  "red_flags": [#red_flag_1#, #red_flag_2#],
  "yellow_flags": [#yellow_flag_1#, #yellow_flag_2#],
}
`;

export const userPrompt = `
Por favor, evaluá este currículum y proporciona una calificación que vaya de C a A, con S para currículums excepcionalmente buenos.
Además, ofrece comentarios detallados sobre cómo se puede mejorar el currículum.

La respuesta debe dirigirse a mí, por lo que en lugar de hablar "sobre el candidato", comunícate directamente conmigo para darme los consejos y debe ser en español argentino/rio-platense.

Seguí estas guía:
--- Comienzo de guía ---
${GUIDE}
--- Fin de guía ---

${NON_FLAGS}
`;

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
        type: "text",
        text: userPrompt,
      },
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
    { role: "system", content: sysPrompt(parsed?.info?.Author) },
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
