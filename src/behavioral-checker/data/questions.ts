export type Question = {
  id: string;
  text: string;
  tags?: string[];
  maxTime: number;
};

export const questions: Question[] = [
  {
    id: "interest-in-position",
    text: "Why are you interested in this position?",
    tags: ["company", "role"],
    maxTime: 90,
  },
  {
    id: "about-yourself",
    text: "Tell me a bit about yourself.",
    maxTime: 90,
  },
  {
    id: "company-values",
    text: "We care a lot about this value. Can you tell me a time when you demonstrated it?",
    tags: ["value"],
    maxTime: 120,
  },
  {
    id: "disagreement-with-leadership",
    text: "How do you handle disagreements with your manager or company leadership?",
    maxTime: 120,
  },
  {
    id: "handling-underperformance",
    text: "How do you handle underperformance in your team?",
    maxTime: 120,
  },
  {
    id: "biggest-technical-challenge",
    text: "What was the most difficult technical challenge you had to face?",
    tags: ["role"],
    maxTime: 120,
  },
  {
    id: "failed-project",
    text: "Tell me about a project of yours that failed.",
    tags: ["role"],
    maxTime: 120,
  },
  {
    id: "questions-for-interviewer",
    text: "Do you have any questions for us?",
    tags: ["company"],
    maxTime: 30,
  },
];
