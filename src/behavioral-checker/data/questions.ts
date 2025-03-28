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
    maxTime: 30,
  },
  {
    id: "about-yourself",
    text: "Tell me about yourself",
    maxTime: 30,
  },
];
