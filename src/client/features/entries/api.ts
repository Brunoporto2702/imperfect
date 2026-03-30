import { post } from "@/client/infra/http";
import type { FoodEntry } from "@/server/core/models/food";

export function createEntry(rawInput: string): Promise<FoodEntry> {
  return post<FoodEntry>("/api/entries", { rawInput });
}
