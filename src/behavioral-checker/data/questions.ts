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
    maxTime: 60,
  },
  {
    id: "about-yourself",
    text: "Tell me a bit about yourself.",
    maxTime: 90,
  },
  {
    id: "company-values",
    text: "We care a lot about this value. Can you tell me a time where you demonstrated it?",
    tags: ["value"],
    maxTime: 60,
  },
  {
    id: "disagreement-with-leadership",
    text: "How do you handle disagreements with your manager or company leadership?",
    maxTime: 60,
  },
  {
    id: "handling-underperformance",
    text: "How do you handle underperformance in your team?",
    maxTime: 60,
  },
  {
    id: "biggest-technical-challenge",
    text: "What was the most difficult technical challenge you had to face?",
    maxTime: 90,
  },
  {
    id: "failed-project",
    text: "Tell me about a project of yours that failed.",
    maxTime: 90,
  },
  {
    id: "questions-for-interviewer",
    text: "Do you have any questions for us?",
    maxTime: 30,
  },
];
