import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { AiResponseSchema, FoodEntry } from "./schema";

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

function sanitizeInput(input: string): string {
  console.log("Raw AI output:", input);
  let output = input;
  // Basic sanitation to remove newlines and excessive whitespace
  output = input.replace(/\s+/g, " ").trim();

  // extract first json block if extra text is present
  const jsonMatch = output.match(/\{.*\}/);
  if (jsonMatch) {
    output = jsonMatch[0];
  }

  return output;
}

export async function parseFood(rawInput: string): Promise<Omit<FoodEntry, "totalCaloriesMin" | "totalCaloriesMax" | "totalProtein">> {
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
    message.content[0].type === "text" ? sanitizeInput(message.content[0].text.trim()) : "";

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
