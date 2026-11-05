import { Question } from "@/behavioral-checker/data/questions";
import { GatewayAIClient } from "../../infrastructure/gateway-ai-client";
import { AssistanceResponse } from "./Action";

export interface AIClient {
  consult(
    questionId: Question["id"],
    question: string,
    response: string,
    exampleResponses: { response: string; score: string }[]
  ): Promise<AssistanceResponse>;
}

export const aiClient = new GatewayAIClient();
