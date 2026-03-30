import { AIProvider, parseAIResponse } from "../logic/parser";
import { FoodEntry } from "../models/food";
import { buildPrompt } from "../logic/prompt";
import { computeTotals } from "../logic/food";

export function createFoodService(provider: AIProvider) {
  return {
    createEntry: async (rawInput: string): Promise<FoodEntry> => {
      const rawText = await provider(buildPrompt(rawInput));
      const parsed = parseAIResponse(rawText, rawInput);
      return computeTotals(parsed);
    },
  };
}

export type FoodService = ReturnType<typeof createFoodService>;
