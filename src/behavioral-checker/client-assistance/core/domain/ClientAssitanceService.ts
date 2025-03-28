import { Question } from "@/behavioral-checker/data/questions";
import { getStrongYesFeedback } from "@/behavioral-checker/notion/database";
import { AssistanceResponse } from "./Action";
import { aiClient, AIClient } from "./AIClient";

export class ClientAssistanceService {
  constructor(private aiClient: AIClient) {}

  async consultByText(
    questionId: Question["id"],
    question: string,
    response: string
  ): Promise<AssistanceResponse> {
    const exampleResponses = await getStrongYesFeedback(questionId);
    return await this.aiClient.consult(
      questionId,
      question,
      response,
      exampleResponses
    );
  }
}

export const clientAssistanceService = new ClientAssistanceService(aiClient);
