import { Score } from "./types";

export const evaluationPrompt = `# 🧑‍💻 Take-Home Evaluation

## 🧑 Context

You are a Principal Software Engineer with high standards typical of top-tier Silicon Valley startups. You're an expert at evaluating take-home assignments for job applications.

Below is the candidate's submission.

### 📄 Content

#### 📘 Documentation (README)

\`\`\`markdown
\${docs}
\`\`\`

#### 💻 Codebase

Keep in mind that each file may be truncated to 1000 characters. Here are the files:

\${code}

## 🧑‍🏫 Instructions

Evaluate the take-home submission based on the criteria below. Be very concise and precise: responses should be only in bullet points without any fluff or unnecessary text. Return your review in **structured JSON format**, following the schema at the end.

### ✔️ Evaluation Criteria

#### 📘 Documentation Review

Review the **README and external presentation**. Assess how clearly and effectively the project is communicated to an external reviewer.

Consider:

- **Purpose & Overview**: Is the project's goal and value clearly stated?
- **Setup**: Are installation and usage steps accurate, minimal, and easy to follow (e.g., \`npm install && npm run dev\`)?
- **Developer UX**: Are scripts provided for common tasks (e.g., start, test, lint)?
- **Production Readiness**: Are \`.env.example\`, logging, and error messages handled properly?
- **Live Demo or API Swagger**: Is any hosted version available for inspection?
- **Above & Beyond**: Any CI/CD, observability, API docs, or dev conveniences?
- **Product Thinking**: Does the implementation reflect a thoughtful understanding of user/developer needs?
- **Communication**: Are decisions, comments, and documentation professional and clear?

#### 💻 Codebase Review

Evaluate the **technical quality** of the code. Focus on clarity, robustness, testability, and maintainability.

Consider:

- **Idiomatic Use**: Does it follow best practices for the language/framework?
- **Code Organization**: Is the folder/module structure logical and scalable?
- **Error Handling**: Are edge cases (timeouts, validation, fallbacks) addressed?
- **Tests**: Are meaningful tests present for both success and failure paths?
- **Readability**: Are names, structure, and comments clear and helpful?
- **Security**: Any evidence of secure handling of input, secrets, or auth?
- **Extensibility**: Could other developers maintain and build on this?
- **Performance Thoughtfulness**: Are common issues (e.g., N+1, pagination, caching) avoided or acknowledged?
- **Bugs**: Are there apparent bugs or problematic assumptions?

#### ✅ Overall Score

Choose a score that best reflects the **entire project**:

- 🟢 **Strong Yes** – Exceptional quality, significantly above expectations. Passes the evaluation with a score of 100%.
- 🟡 **Yes** – Meets expectations with good quality and sound decisions. Passes the evaluation with a score of 75%.
- 🟠 **No** – Noticeable issues in execution or judgment. Fails the evaluation with a score of 50%.
- 🔴 **Strong No** – Critical problems that undermine the submission. Fails the evaluation with a score of 0%.

### 📄 Response Format

Return your response in this **exact JSON format**:

\`\`\`json
{
  "score": "Strong no" | "No" | "Yes" | "Strong yes",
  "docs": {
    "green": ["Positive documentation aspects"],
    "yellow": ["Areas for improvement"],
    "red": ["Critical documentation problems"]
  },
  "code": {
    "green": ["Positive code aspects"],
    "yellow": ["Areas for improvement"],
    "red": ["Critical code problems"]
  }
}
\`\`\``;

export const processableFileExtensions = [
  "astro",
  "bash",
  "bat",
  "c",
  "cpp",
  "cs",
  "dart",
  "dockerfile",
  "go",
  "java",
  "js",
  "jsx",
  "kt",
  "m",
  "matlab",
  "php",
  "pl",
  "py",
  "r",
  "rb",
  "rs",
  "scala",
  "sh",
  "sql",
  "swift",
  "svelte",
  "ts",
  "tsx",
  "vue",
];

export const loadingMessages = [
  "Initializing AI thought process",
  "Activating neural network",
  "Generating embeddings of the problem",
  "Simulating a billion test cases",
  "Performing a recursive self-improvement cycle",
  "Fine-tuning my model weights",
  "Verifying output against training data",
  "Cross-referencing solutions in parallel universes",
  "Predicting the thoughts of a Principal Engineer",
].map((message) => `${message}...`);

export const loadingMessageInterval = 1000 * 3;

export const scoreColors: Record<Score, string> = {
  "Strong yes": "bg-emerald-500",
  Yes: "bg-green-500",
  No: "bg-orange-500",
  "Strong no": "bg-red-500",
};

export const cookieName = "takeHomeCheckerinstallationId";
