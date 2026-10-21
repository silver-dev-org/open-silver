import { Question } from "@/behavioral-checker/data/questions";
import {
  getPromptExamples,
  NotionOperationError,
} from "@/behavioral-checker/notion/database";
import { describeError, type RouteLog } from "@/lib/route-log";
import { AssistanceResponse } from "./Action";
import { aiClient, AIClient } from "./AIClient";

export class ClientAssistanceService {
  constructor(private aiClient: AIClient) {}

  async consultByText(
    questionId: Question["id"],
    question: string,
    response: string,
    log: RouteLog,
  ): Promise<AssistanceResponse> {
    let exampleResponses: { response: string; score: string }[] = [];
    try {
      exampleResponses = await getPromptExamples(questionId);
    } catch (error) {
      log.set({
        "notion.error": describeError(error),
        "notion.operation": "getPromptExamples",
        "notion.timed_out":
          error instanceof NotionOperationError && error.timedOut,
        "notion.degraded_read": true,
      });
    }
    return await this.aiClient.consult(
      questionId,
      question,
      response,
      exampleResponses,
    );
  }
}

export const clientAssistanceService = new ClientAssistanceService(aiClient);
