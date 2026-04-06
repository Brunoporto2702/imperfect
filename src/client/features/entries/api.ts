import { post } from "@/client/infra/http";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";

export type CreateEntryResponse = {
  intakeEntry: IntakeEntry;
  intakeItems: IntakeItem[];
};

export function createItemsEntry(rawInput: string): Promise<CreateEntryResponse> {
  return post<CreateEntryResponse>("/api/entries", { inputType: "items", rawInput });
}

export function createImageEntry(imageDataUrl: string, description?: string): Promise<CreateEntryResponse> {
  return post<CreateEntryResponse>("/api/entries", { inputType: "image", imageDataUrl, description });
}
