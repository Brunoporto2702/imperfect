import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "@/core/logic/parser";

const client = new Anthropic();

export const anthropicProvider: AIProvider = async (message) => {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: message }],
  });

  return response.content[0].type === "text" ? response.content[0].text.trim() : "";
};
