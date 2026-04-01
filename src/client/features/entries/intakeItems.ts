import { getItem, setItem } from "@/client/infra/storage";
import type { IntakeItem } from "@/server/core/models/food";

const STORAGE_KEY = "imperfect:intakeItems";

export function loadIntakeItems(): IntakeItem[] {
  return getItem<IntakeItem[]>(STORAGE_KEY, []);
}

export function saveIntakeItems(items: IntakeItem[]): void {
  setItem(STORAGE_KEY, items);
}

export function addIntakeItems(items: IntakeItem[]): void {
  saveIntakeItems([...items, ...loadIntakeItems()]);
}

export function deleteIntakeItem(id: string): void {
  saveIntakeItems(loadIntakeItems().filter((item) => item.id !== id));
}

export function deleteIntakeItemsByProcessingId(processingId: string): void {
  saveIntakeItems(loadIntakeItems().filter((item) => item.processingId !== processingId));
}

export function updateIntakeItem(updated: IntakeItem): void {
  saveIntakeItems(
    loadIntakeItems().map((item) => (item.id === updated.id ? updated : item))
  );
}
