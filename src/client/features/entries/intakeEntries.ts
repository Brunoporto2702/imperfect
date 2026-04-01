import { getItem, setItem } from "@/client/infra/storage";
import type { IntakeEntry } from "@/server/core/models/food";

const STORAGE_KEY = "imperfect:intakeEntries";

export function loadIntakeEntries(): IntakeEntry[] {
  return getItem<IntakeEntry[]>(STORAGE_KEY, []);
}

export function saveIntakeEntries(entries: IntakeEntry[]): void {
  setItem(STORAGE_KEY, entries);
}

export function addIntakeEntry(entry: IntakeEntry): void {
  saveIntakeEntries([entry, ...loadIntakeEntries()]);
}
