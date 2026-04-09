import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import type { IntakeItem } from "../models/food";
import * as UserRepository from "../../providers/persistence/sql/user";
import * as ItemRepository from "../../providers/persistence/sql/item";

export type ItemPatch = {
  name?: string;
  quantity?: string;
  caloriesMin?: number;
  caloriesMax?: number;
  protein?: number | null;
  consumedAt?: string;
  source?: "ai" | "manual";
  processingId?: string | null;
  editedByUser?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function saveItems(db: SqlDb, userId: string, items: IntakeItem[]): Promise<boolean> {
  const user = await UserRepository.findUserById(db, userId);
  if (!user) return false;

  await ItemRepository.saveItems(db, userId, items);
  return true;
}

export async function updateItem(db: SqlDb, userId: string, id: string, patch: ItemPatch): Promise<void> {
  await ItemRepository.updateItem(db, userId, id, {
    ...patch,
    protein: patch.protein === null ? undefined : patch.protein,
  });
}

export async function deleteItem(db: SqlDb, userId: string, id: string): Promise<void> {
  await ItemRepository.deleteItem(db, userId, id);
}
