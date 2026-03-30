import { AIProvider, parseAIResponse } from "../logic/parser";
import { FoodEntry } from "../models/food";
import { buildPrompt } from "../logic/prompt";
import { computeTotals } from "../logic/food";

export async function createEntry(rawInput: string, provider: AIProvider): Promise<FoodEntry> {
  const rawText = await provider(buildPrompt(rawInput));
  const parsed = parseAIResponse(rawText, rawInput);
  return computeTotals(parsed);
}
