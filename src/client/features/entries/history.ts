import { getItem, setItem } from "@/client/infra/storage";
import type { FoodEntry } from "@/server/core/models/food";

const STORAGE_KEY = "imperfect:history";

export function loadHistory(): FoodEntry[] {
  return getItem<FoodEntry[]>(STORAGE_KEY, []);
}

export function saveHistory(entries: FoodEntry[]): void {
  setItem(STORAGE_KEY, entries);
}
