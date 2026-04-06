import { AIProvider, parseAIResponse } from "../logic/parser";
import { buildIntakeItems } from "../logic/food";
import { buildPrompt } from "../logic/prompt";
import type { CreateEntryRequest } from "../models/entry";
import type { IntakeEntry, IntakeItem } from "../models/food";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import * as EntryRepository from "../../providers/persistence/sql/entry";

export type CreateEntryResult = {
  intakeEntry: IntakeEntry;
  intakeItems: IntakeItem[];
};

export async function createEntry(
  request: CreateEntryRequest,
  provider: AIProvider,
  db: SqlDb
): Promise<CreateEntryResult> {
  const payload = buildPrompt(request);
  const rawText = await provider(payload);
  const inputText =
    request.inputType === "items" || request.inputType === "text"
      ? request.rawInput
      : request.description ?? "[image]";
  const intakeEntry = parseAIResponse(rawText, inputText);
  const intakeItems = buildIntakeItems(intakeEntry);
  await EntryRepository.save(db, intakeEntry);
  return { intakeEntry, intakeItems };
}
