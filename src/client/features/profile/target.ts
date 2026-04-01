import { getItem, setItem } from "@/client/infra/storage";

const STORAGE_KEY = "imperfect:dailyTarget";

export function loadTarget(): number | null {
  return getItem<number | null>(STORAGE_KEY, null);
}

export function saveTarget(kcal: number | null): void {
  setItem(STORAGE_KEY, kcal);
}
