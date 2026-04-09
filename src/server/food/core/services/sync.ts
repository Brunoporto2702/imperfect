import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import type { IntakeEntry, IntakeItem } from "../models/food";
import * as UserRepository from "../../providers/persistence/sql/user";
import * as EntryRepository from "../../providers/persistence/sql/entry";
import * as ItemRepository from "../../providers/persistence/sql/item";

export type UserSyncData = {
  entries: IntakeEntry[];
  items: IntakeItem[];
};

export async function getUserSyncData(db: SqlDb, userId: string): Promise<UserSyncData | null> {
  const user = await UserRepository.findUserById(db, userId);
  if (!user) return null;

  const [entries, items] = await Promise.all([
    EntryRepository.getEntriesByUserId(db, userId),
    ItemRepository.getItemsByUserId(db, userId),
  ]);

  return { entries, items };
}

export async function migrateUserData(
  db: SqlDb,
  userId: string,
  entries: IntakeEntry[],
  items: IntakeItem[]
): Promise<boolean> {
  const user = await UserRepository.findUserById(db, userId);
  if (!user) return false;

  for (const entry of entries) {
    await EntryRepository.save(db, entry, userId);
  }
  await ItemRepository.saveItems(db, userId, items);

  return true;
}
