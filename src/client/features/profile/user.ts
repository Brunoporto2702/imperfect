import { getItem, setItem } from "@/client/infra/storage";

const STORAGE_KEY = "imperfect:userId";

export function loadUserId(): string | null {
  return getItem<string | null>(STORAGE_KEY, null);
}

export function saveUserId(id: string): void {
  setItem(STORAGE_KEY, id);
}

export function clearUserId(): void {
  setItem(STORAGE_KEY, null);
}
