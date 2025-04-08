import { Question } from "@/behavioral-checker/data/questions";
import OpenAI from "openai";
import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { AIClient } from "../core/domain/AIClient";
import { AssistanceResponse } from "../core/domain/Action";

export class OpenAISdkAIClient implements AIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async consult(
    questionId: Question["id"],
    question: string,
    response: string,
    exampleResponses: string[]
  ): Promise<AssistanceResponse> {
    try {
      const message = this.getInitialMessage(
        question,
        response,
        exampleResponses
      );
      const res = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [message],
        max_tokens: 300,
      });

      const assistantMessage = res.choices[0].message.content || "";

      return {
        ...JSON.parse(
          assistantMessage.replace("```json", "").replace("```", "")
        ),
        question,
        questionId,
        response,
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  private getInitialMessage(
    question: string,
    response: string,
    exampleResponses: string[]
  ): ChatCompletionSystemMessageParam {
    const examplesPrompt = this.getExamplesPrompt(exampleResponses);

    return {
      role: "system",
      content: `You are an expert in evaluating behavioral interview responses. Your task is to analyze a given response based on the principles of effective storytelling and interview best practices as outlined below:

**Introduction and Presentation**:
**DO**: Highlight relevant technical experience, personal projects, open-source contributions, and key skills.
**DO**: Mention specific achievements and how they align with the company's mission.
**DON'T**: Mention irrelevant personal projects or outdated experience.
**DON'T**: Talk about hobbies or personal stories that are not relevant to the role.

**Interest in the Position**:
**DO**: Focus on specific features or characteristics of the company or its products.
**DO**: Emphasize how your skills and motivations align with the company's mission and goals.
**DON'T**: Use generic statements about the industry.
**DON'T**: Focus on personal benefits like learning, making money, or having fun.
**DON'T**: Expect the company to explain what they do if the information is publicly available.

**Company Values**:
**DO**: Research the company’s values and demonstrate alignment through personal stories and experiences.
**DO**: Prepare examples that showcase your ability to align with and embody these values.
**DON'T**: Expect the company to present or explain their values.
**DON'T**: Dismiss the importance of the company’s values.

**Professional Experience Stories**:
**DO**: Use concise and clear stories to showcase your personal contributions and impact.
**DO**: Follow the STAR method (Situation, Task, Action, Result) to structure responses.
**DO**: Teach the interviewer something new about your approach or experience.
**DON'T**: Overcomplicate your story with unnecessary technical details.
**DON'T**: Focus only on team efforts or what leadership achieved.
**DON'T**: Present yourself as a victim of circumstances or stretch stories without resolution.

**Engaging with the Interviewer**:
**DO**: Prepare insightful questions that go beyond publicly available information.
**DO**: Ask questions that help you evaluate your fit with the company (e.g., runway, employee attrition, product-market fit).
**DON'T**: Ask generic or easily answerable questions (e.g., team composition, typical day).
**DON'T**: Repeat information that is already available on the company's website or public materials.

**Behavioral Storytelling Principles**:
Follow the STAR method to clearly explain:
**Situation**: The context or background of the task.
**Task**: The specific challenge or responsibility you faced.
**Action**: The steps you took to address the task.
**Result**: The outcome of your actions and what you learned.
Provide specific examples and focus on outcomes achieved.
Highlight personal contributions and avoid using \"we\" unless referring to specific team dynamics.
Demonstrate reflection, learning, and professional growth.

**Evaluation Metrics**:
**redFlags**: Identify shortcomings in the response, such as:
Lacks specificity or focus.
Fails to follow the STAR method.
Misalignment with company values or the role's requirements.
**greenFlags**: Highlight strengths in the response, such as:
Provides specific, measurable examples.
Follows the STAR method effectively.
Demonstrates alignment with the company’s values and mission.
**result**: Categorize the response into one of the following:
**Strong no**: The response is completely misaligned with expectations.
**No**: The response is below average but shows some potential.
**Yes**: The response is good and meets most of the expectations.
**Strong yes**: The response is excellent and exceeds expectations.

The response must be returned in JSON format.

Here is an example of the expected output:
\`\`\`json
{"redFlags":["Lacks specificity","Does not mention outcomes"],"greenFlags":["Demonstrates growth","Uses a clear example aligned with company values"],"result":"Yes"}
\`\`\`

${examplesPrompt}
The user answered this question: "${question}". 
The user responded with: "${response}".

Analyze the response and provide the JSON output as specified.
`,
    };
  }

  private getExamplesPrompt(exampleResponses: string[]): string {
    if (exampleResponses.length === 0) {
      return "";
    }

    let examplesPrompt =
      "Use these Strong yes examples to help the AI understand how a strong yes response looks like:\n";

    exampleResponses.forEach((response, index) => {
      examplesPrompt += `Strong yes Example ${index + 1}: ${response}\n`;
    });

    return examplesPrompt;
  }
}
