import { Question } from "@/behavioral-checker/data/questions";
import OpenAI from "openai";
import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { AIClient } from "../core/domain/AIClient";
import { AssistanceResponse } from "../core/domain/Action";

export class OpenAISdkAIClient implements AIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async consult(
    questionId: Question["id"],
    question: string,
    response: string,
    exampleResponses: string[]
  ): Promise<AssistanceResponse> {
    try {
      const message = this.getInitialMessage(
        question,
        response,
        exampleResponses
      );
      const res = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [message],
        max_tokens: 300,
      });

      const assistantMessage = res.choices[0].message.content || "";

      return {
        ...JSON.parse(
          assistantMessage.replace("```json", "").replace("```", "")
        ),
        question,
        questionId,
        response,
      };
    } catch (error: any) {
      throw error;
    }
  }

  private getInitialMessage(
    question: string,
    response: string,
    exampleResponses: string[]
  ): ChatCompletionSystemMessageParam {
    let examplesPrompt = this.getExamplesPrompt(exampleResponses);

    return {
      role: "system",
      content: `${process.env.OPENAI_PROMPT}
            ${examplesPrompt}
            The user answered this question: "${question}". 
            The user responded with: "${response}".
            
            Analyze the response and provide the JSON output as specified.
            `,
    };
  }

  private getExamplesPrompt(exampleResponses: string[]): string {
    if (exampleResponses.length === 0) {
      return "";
    }

    let examplesPrompt =
      "Use these Strong yes examples to help the AI understand how a strong yes response looks like:\n";

    exampleResponses.forEach((response, index) => {
      examplesPrompt += `Strong yes Example ${index + 1}: ${response}\n`;
    });

    return examplesPrompt;
  }
}
