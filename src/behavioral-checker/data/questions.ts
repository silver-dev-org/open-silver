export type Question = {
  id: string;
  text: string;
  tags?: string[];
  minTime: number;
  maxTime: number;
};

export const questions: Question[] = [
  {
    id: "interest-in-position",
    text: "Why are you interested in this position?",
    tags: ["company", "role"],
    minTime: 10,
    maxTime: 90,
  },
  {
    id: "about-yourself",
    text: "Tell me a bit about yourself.",
    minTime: 10,
    maxTime: 90,
  },
  {
    id: "superpower",
    text: "What's your superpower?",
    minTime: 10,
    maxTime: 90,
  },
  {
    id: "company-values",
    text: "Can you tell me a time when you demonstrated this value?",
    tags: ["value"],
    minTime: 15,
    maxTime: 120,
  },
  {
    id: "disagreement-with-leadership",
    text: "How do you handle disagreements with your manager or company leadership?",
    minTime: 15,
    maxTime: 120,
  },
  {
    id: "handling-underperformance",
    text: "How do you handle underperformance in your team?",
    minTime: 15,
    maxTime: 120,
  },
  {
    id: "biggest-technical-challenge",
    text: "What was the most difficult technical challenge you had to face?",
    tags: ["role"],
    minTime: 15,
    maxTime: 120,
  },
  {
    id: "failed-project",
    text: "Tell me about a project of yours that failed.",
    tags: ["role"],
    minTime: 15,
    maxTime: 120,
  },
  {
    id: "questions-for-interviewer",
    text: "Do you have any questions for us?",
    tags: ["company"],
    minTime: 2,
    maxTime: 20,
  },
];
