import { randomUUID } from "crypto";
import { AiResponseSchema, FoodEntry } from "./schema";

export type AIParser = (
  rawInput: string
) => Promise<Omit<FoodEntry, "totalCaloriesMin" | "totalCaloriesMax" | "totalProtein">>;

export function sanitizeInput(input: string): string {
  let output = input.replace(/\s+/g, " ").trim();
  const jsonMatch = output.match(/\{.*\}/);
  if (jsonMatch) output = jsonMatch[0];
  return output;
}

export function parseAIResponse(
  rawText: string,
  rawInput: string
): Omit<FoodEntry, "totalCaloriesMin" | "totalCaloriesMax" | "totalProtein"> {
  const text = sanitizeInput(rawText);

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
