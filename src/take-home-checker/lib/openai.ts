import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const SYSTEM_MESSAGE = `
You are a Principal Software Engineer, an expert in analyzing GitHub repositories.
Limit responses to concise bullet points.`;

export async function analyzeText(prompt: string, max_tokens = 1000): Promise<string> {

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: SYSTEM_MESSAGE },
                { role: "user", content: prompt }],
            max_tokens,
        });

        return response.choices[0].message.content || 'No analysis available';
    } catch (error) {
        console.error("Error analyzing text:", error);
        throw new Error("Failed to analyze text");
    }
}
