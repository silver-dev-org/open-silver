import { Question } from "@/behavioral-checker/data/questions";
import { OpenAISdkAIClient } from "../../infrastructure/OpenAISdkAIClient";
import { AssistanceResponse } from "./Action";

export interface AIClient {
  consult(
    questionId: Question["id"],
    question: string,
    response: string,
    exampleResponses: string[]
  ): Promise<AssistanceResponse>;
}

export const aiClient = new OpenAISdkAIClient();
