import OpenAI from "openai";

export class DeepSeekConfigError extends Error {
  constructor() {
    super("DeepSeek API 未配置");
    this.name = "DeepSeekConfigError";
  }
}

export function isDeepSeekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function callDeepSeek(prompt: string) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new DeepSeekConfigError();
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
  });

  const response = await client.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    messages: [
      {
        role: "system",
        content:
          "You are the AI engine for AI邵峰健身. Be practical, structured, safe, and conservative when risk is present."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.4
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("DeepSeek did not return content.");
  return content;
}
