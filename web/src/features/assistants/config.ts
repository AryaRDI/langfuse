export const DEFAULT_ASSISTANT_CONFIG = {
  name: "Default GPT",
  systemPrompt:
    "You are a helpful AI assistant integrated with Langfuse. Provide clear, accurate, and helpful responses.",
  provider: "OpenAI",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 1000,
} as const;
