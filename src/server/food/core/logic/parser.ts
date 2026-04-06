import { randomUUID } from "crypto";
import { AiResponseDtoSchema } from "../dto/ai";
import type { IntakeEntry } from "../models/food";

export type AIProvider = (message: string) => Promise<string>;

export function sanitizeInput(input: string): string {
  let output = input.replace(/\s+/g, " ").trim();
  const jsonMatch = output.match(/\{.*\}/);
  if (jsonMatch) output = jsonMatch[0];
  return output;
}

export function parseAIResponse(rawText: string, inputText: string): IntakeEntry {
  const text = sanitizeInput(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`);
  }

  const dto = AiResponseDtoSchema.parse(parsed);
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    inputText,
    outputText: rawText,
    parsedItems: dto.items,
    createdAt: now,
  };
}
