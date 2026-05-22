import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODEL = "gemini-2.5-flash";
const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

export const gemini = {
  async generateText(prompt: string): Promise<string> {
    return withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
  },

  async generateJSON<T>(prompt: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\n必ずJSON形式のみで返答してください。マークダウンのコードブロックや説明文は不要です。`;
    const text = await gemini.generateText(jsonPrompt);
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned) as T;
  },
};
