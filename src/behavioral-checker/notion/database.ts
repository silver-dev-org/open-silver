import {
  AssistanceResponse,
  Result,
} from "@/behavioral-checker/client-assistance/core/domain/Action";
import { Question } from "@/behavioral-checker/data/questions";
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

export const addFeedbackToNotion = async (
  data: AssistanceResponse
): Promise<void> => {
  try {
    const res = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        ID: { select: { name: data.questionId } },
        Date: { date: { start: new Date().toISOString() } },
        Question: { title: [{ text: { content: data.question } }] },
        Answer: { rich_text: [{ text: { content: data.response } }] },
        Score: { select: { name: data.result } },
        Length: { number: data.response.length },
        "Green flags": {
          rich_text: [{ text: { content: data.greenFlags.join(", ") } }],
        },
        "Red flags": {
          rich_text: [{ text: { content: data.redFlags.join(", ") } }],
        },
      },
    });

    console.log("Registro añadido:", res.id);
  } catch (error: any) {
    console.error("Error añadiendo registro:", error.message);
    throw new Error("Failed to add feedback to Notion");
  }
};

export const getStrongYesFeedback = async (
  questionId: Question["id"]
): Promise<any[]> => {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: "ID",
            select: {
              equals: questionId,
            },
          },
          {
            property: "Score",
            select: {
              equals: "Strong yes",
            },
          },
        ],
      },
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
      page_size: 10,
    });

    return response.results.map((r) => {
      if (r.object === "page") {
        const page = r as PageObjectResponse;
        if (
          page.properties.Answer !== undefined &&
          page.properties.Answer.type === "rich_text"
        ) {
          return page.properties.Answer.rich_text[0].plain_text;
        }
      }
      return "No response found";
    });
  } catch (error: any) {
    console.error("Error al obtener respuestas:", error.message);
    throw new Error("Failed to fetch feedback from Notion");
  }
};

export const getLastFeedback = async (
  questionId: Question["id"],
  result: Result
): Promise<AssistanceResponse | null> => {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: "ID",
            select: {
              equals: questionId,
            },
          },
          {
            property: "Revised score",
            select: {
              equals: result,
            },
          },
        ],
      },
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
      page_size: 1,
    });

    if (response.results.length === 0) return null;

    const page = response.results[0] as PageObjectResponse;
    const properties = page.properties;

    if (
      properties.ID.type !== "select" ||
      properties.Question.type !== "title" ||
      properties.Answer.type !== "rich_text" ||
      properties.Score.type !== "select" ||
      properties.Score.select === null ||
      properties["Green flags"].type !== "rich_text" ||
      properties["Red flags"].type !== "rich_text"
    ) {
      console.error("Propiedades de Notion con formato incorrecto");
      return null;
    }

    const greenFlagsText =
      properties["Green flags"].rich_text[0].plain_text.trim();
    const redFlagsText = properties["Red flags"].rich_text[0].plain_text.trim();
    const greenFlags = greenFlagsText ? greenFlagsText.split(", ") : [];
    const redFlags = redFlagsText ? redFlagsText.split(", ") : [];

    return {
      questionId: properties.ID.select?.name || "",
      question: properties.Question.title[0].plain_text,
      response: properties.Answer.rich_text[0].plain_text,
      result: properties.Score.select?.name as Result,
      greenFlags,
      redFlags,
    };
  } catch (error: any) {
    console.error("Error al obtener respuestas:", error.message);
    throw new Error("Failed to fetch feedback from Notion");
  }
};
