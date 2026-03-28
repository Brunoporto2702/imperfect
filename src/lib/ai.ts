import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { AiResponseSchema, FoodEntry } from "./schema";

const client = new Anthropic();

const PROMPT = `You are a food calorie estimator. Parse the food description and return ONLY a JSON object — no explanation, no markdown.

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
  "totalCaloriesMin": number,
  "totalCaloriesMax": number,
  "totalProtein": number,
  "confidence": "low" | "medium" | "high"
}

Rules:
- Always use ranges (caloriesMin/caloriesMax), never exact values
- Make reasonable portion assumptions when not specified
- confidence: "high" = clearly described, "medium" = portions assumed, "low" = vague description
- Omit protein if truly unknown`;

export async function parseFood(rawInput: string): Promise<FoodEntry> {
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

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`);
  }

  const validated = AiResponseSchema.parse(parsed);

  return {
    id: randomUUID(),
    createdAt: new Date(),
    rawInput,
    ...validated,
  };
}
