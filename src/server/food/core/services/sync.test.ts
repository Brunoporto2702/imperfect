import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { getUserSyncData, migrateUserData } from "./sync";
import type { IntakeEntry, IntakeItem } from "../models/food";

function makeEntry(overrides?: Partial<IntakeEntry>): IntakeEntry {
  return {
    id: "entry-1",
    inputText: "two eggs",
    parsedItems: [{ name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeItem(overrides?: Partial<IntakeItem>): IntakeItem {
  return {
    id: "item-1",
    name: "scrambled eggs",
    quantity: "2 eggs",
    caloriesMin: 140,
    caloriesMax: 200,
    protein: 12,
    consumedAt: new Date().toISOString(),
    source: "ai",
    editedByUser: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function setup() {
  const db = createInMemoryDb();
  await runMigrations(db, migrations);
  return { db };
}

async function seedUser(db: Awaited<ReturnType<typeof setup>>["db"], id = "user-1") {
  await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
    id, `${id}@example.com`, new Date().toISOString(),
  ]);
}

describe("getUserSyncData", () => {
  it("returns null when user does not exist", async () => {
    const { db } = await setup();

    const result = await getUserSyncData(db, "nonexistent");

    expect(result).toBeNull();
  });

  it("returns entries and items for the user", async () => {
    const { db } = await setup();
    await seedUser(db);
    await migrateUserData(db, "user-1", [makeEntry()], [makeItem()]);

    const result = await getUserSyncData(db, "user-1");

    expect(result).not.toBeNull();
    expect(result!.entries).toHaveLength(1);
    expect(result!.items).toHaveLength(1);
    expect(result!.entries[0].id).toBe("entry-1");
    expect(result!.items[0].id).toBe("item-1");
  });

  it("returns empty arrays when user has no data", async () => {
    const { db } = await setup();
    await seedUser(db);

    const result = await getUserSyncData(db, "user-1");

    expect(result!.entries).toHaveLength(0);
    expect(result!.items).toHaveLength(0);
  });
});

describe("migrateUserData", () => {
  it("returns false when user does not exist", async () => {
    const { db } = await setup();

    const ok = await migrateUserData(db, "nonexistent", [makeEntry()], [makeItem()]);

    expect(ok).toBe(false);
  });

  it("saves entries and items and returns true", async () => {
    const { db } = await setup();
    await seedUser(db);

    const ok = await migrateUserData(db, "user-1", [makeEntry()], [makeItem()]);

    expect(ok).toBe(true);
    const { rows: entryRows } = await db.execute("SELECT * FROM intake_entries WHERE user_id = ?", ["user-1"]);
    const { rows: itemRows } = await db.execute("SELECT * FROM intake_items WHERE user_id = ?", ["user-1"]);
    expect(entryRows).toHaveLength(1);
    expect(itemRows).toHaveLength(1);
  });

  it("is idempotent when called twice with the same data", async () => {
    const { db } = await setup();
    await seedUser(db);

    await migrateUserData(db, "user-1", [makeEntry()], [makeItem()]);
    await migrateUserData(db, "user-1", [makeEntry()], [makeItem()]);

    const { rows } = await db.execute("SELECT * FROM intake_items WHERE user_id = ?", ["user-1"]);
    expect(rows).toHaveLength(1);
  });
});
