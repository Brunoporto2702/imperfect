import Anthropic from "@anthropic-ai/sdk";
import type { AIParser } from "./ai";
import { parseAIResponse } from "./ai";

const client = new Anthropic();

const PROMPT = `You are a food calorie estimator. Parse the food description. Return ONLY valid JSON. No markdown. No commentary. No backticks.

example valid response:
{
  "items": [
    {
      "name": "2 scrambled eggs",
      "quantity": "2 eggs",
      "caloriesMin": 140,
      "caloriesMax": 200,
      "protein": 12
    }
  ],
  "confidence": "high"
}

example invalid response (don't return this):
2 scrambled eggs (140-200 calories, 12g protein)
\`\`\` json
{
  "items": [
    {
      "name": "2 scrambled eggs",
      "quantity": "2 eggs",
      "caloriesMin": 140,
      "caloriesMax": 200,
      "protein": 12
    }
  ],
  "confidence": "high"
}
\`\`\`

JSON structure:
{
  "items": [
    {
      "name": "string",
      "quantity": "string",
      "caloriesMin": number,
      "caloriesMax": number,
      "protein": number
    }
  ],
  "confidence": "low" | "medium" | "high"
}

Rules:
- Always use ranges (caloriesMin/caloriesMax), never exact values
- Make reasonable portion assumptions when not specified
- confidence: "high" = clearly described, "medium" = portions assumed, "low" = vague description
- Omit protein if truly unknown`;

export const parseFood: AIParser = async (rawInput) => {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `${PROMPT}\n\nFood description: ${rawInput}`,
      },
    ],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  return parseAIResponse(rawText, rawInput);
};
