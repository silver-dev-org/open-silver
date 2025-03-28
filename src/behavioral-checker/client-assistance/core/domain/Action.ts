import { Question } from "@/behavioral-checker/data/questions";

export type Result = "Strong no" | "No" | "Yes" | "Strong yes";

export type AssistanceResponse = {
  redFlags: string[];
  greenFlags: string[];
  result: Result;
  questionId: Question["id"];
  question: string;
  response: string;
};
