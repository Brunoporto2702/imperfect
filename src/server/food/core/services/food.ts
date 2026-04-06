import { AIProvider, parseAIResponse } from "../logic/parser";
import { buildIntakeItems } from "../logic/food";
import { buildPrompt } from "../logic/prompt";
import type { IntakeEntry, IntakeItem } from "../models/food";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import * as EntryRepository from "../../providers/persistence/sql/entry";

export type CreateEntryResult = {
  intakeEntry: IntakeEntry;
  intakeItems: IntakeItem[];
};

export async function createEntry(
  rawInput: string,
  provider: AIProvider,
  db: SqlDb
): Promise<CreateEntryResult> {
  const prompt = buildPrompt(rawInput);
  const rawText = await provider(prompt);
  const intakeEntry = parseAIResponse(rawText, rawInput);
  const intakeItems = buildIntakeItems(intakeEntry);
  await EntryRepository.save(db, intakeEntry);
  return { intakeEntry, intakeItems };
}
