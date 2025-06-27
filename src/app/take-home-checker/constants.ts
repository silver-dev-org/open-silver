import { Score } from "./types";

export const readmeEvaluationPrompt = `🧭 README & Interviewer Experience Review

You are reviewing the **README and external presentation** of a take-home GitHub repository.

Evaluate how clearly and effectively the candidate has documented the project for an external reviewer or hiring manager. This reflects their communication ability and attention to real-world developer experience.

Criteria:
- **README Quality**: Does the README explain the project's purpose, how to set it up, run it, test it, and what to expect?
- **Setup Instructions**: Are setup steps minimal, accurate, and easy to follow? (e.g. \`npm install && npm run dev\`, Docker, Makefile)
- **Demo/Live URL**: Is a live version available (e.g. web frontend, Swagger for API, or hosted backend)?
- **Developer Commands**: Are standard scripts available and documented for running, testing, linting, formatting, etc.?
- **Production Readiness**: Does the repo reflect real-world hygiene (e.g. \`.env.example\`, error messages, useful logs)?
- **Above-and-Beyond Elements**: Is there anything unexpected and impressive (CI config, observability tools, good API docs)?
- **Product Sense**: Does the delivery show an understanding and intepretation of the solution to satisfy it's intended users? (does it include product features for users or conveniences for would-be developers?)
- **Communication Quality**: Are comments, explanations, and decisions clearly and professionally communicated?

Notes: \${content}
`;

export const codeEvaluationPrompt = `🧠 Codebase & Technical Quality Review

You are reviewing the **codebase quality and technical implementation** of the take-home project.

Focus on the candidate’s engineering fundamentals, code clarity, test coverage, and architectural choices. Evaluate depth without penalizing simplicity.

Criteria:
- **Idiomatic Code**: Does the code follow the best practices of the chosen language and framework?
- **Error Free**: Does the solution have easy-to-find bugs or suspects by AI?
- **Code Structure**: Is the folder/module layout clean, scalable, and not over-engineered?
- **Error Handling**: Are edge cases thoughtfully handled (e.g. validation, timeouts, retries, fallbacks)?
- **Test Coverage**: Are meaningful tests included? Do they cover both happy paths and failures? Are tests easy to run?
- **Code Readability**: Is the code clear, well-named, and easy to follow?
- **Security Practices**: Are security principles considered (input validation, secret handling, basic auth stubs)?
- **Extensibility**: Could this code be easily extended or maintained by a team?
- **Performance Awareness**: Are there signs of performance thoughtfulness (e.g. avoiding N+1s, pagination, caching placeholders)?

Notes: \${codeNotes}
`;

export const loadingMessages = [
  "Initializing AI thought process...",
  "Activating neural network...",
  "Generating embeddings of the problem...",
  "Simulating a billion test cases...",
  "Performing a recursive self-improvement cycle...",
  "Fine-tuning my model weights...",
  "Verifying output against training data...",
  "Cross-referencing solutions in parallel universes...",
  "Predicting the next optimal code sequence...",
];

export const scoreColors: Record<Score, string> = {
  "Strong yes": "bg-green-500",
  Yes: "bg-green-500",
  No: "bg-red-500",
  "Strong no": "bg-green-500",
};

export const fileCacheDuration = 1000 * 60 * 2;

export const loadingMessageInterval = 1000 * 3;
