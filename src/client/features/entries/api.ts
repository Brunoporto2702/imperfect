import { post } from "@/client/infra/http";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";

export type CreateEntryResponse = {
  intakeEntry: IntakeEntry;
  intakeItems: IntakeItem[];
};

export function createEntry(rawInput: string): Promise<CreateEntryResponse> {
  return post<CreateEntryResponse>("/api/entries", { rawInput });
}
