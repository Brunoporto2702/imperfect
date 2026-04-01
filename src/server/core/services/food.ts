import { AIProvider, parseAIResponse } from "../logic/parser";
import { buildIntakeItems } from "../logic/food";
import { buildPrompt } from "../logic/prompt";
import type { IntakeEntry, IntakeItem } from "../models/food";

export type CreateEntryResult = {
  intakeEntry: IntakeEntry;
  intakeItems: IntakeItem[];
};

export async function createEntry(
  rawInput: string,
  provider: AIProvider
): Promise<CreateEntryResult> {
  const prompt = buildPrompt(rawInput);
  const rawText = await provider(prompt);
  const intakeEntry = parseAIResponse(rawText, rawInput);
  const intakeItems = buildIntakeItems(intakeEntry);
  return { intakeEntry, intakeItems };
}
