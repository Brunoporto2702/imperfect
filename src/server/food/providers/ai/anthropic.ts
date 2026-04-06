import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "@/server/food/core/logic/parser";

const client = new Anthropic();

export const anthropicProvider: AIProvider = async ({ text, imageDataUrl }) => {
  const content: Anthropic.MessageParam["content"] = [];

  if (imageDataUrl) {
    const [prefix, data] = imageDataUrl.split(",");
    const mediaType = prefix.replace("data:", "").replace(";base64", "") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    content.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
  }

  content.push({ type: "text", text });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  });

  return response.content[0].type === "text" ? response.content[0].text.trim() : "";
};
