import { describe, it, expect, vi } from "vitest";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { saveItems, updateItem, deleteItem } from "./item";
import * as ItemRepository from "../../providers/persistence/sql/item";
import type { IntakeItem } from "../models/food";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";

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

function makeDb(): SqlDb {
  return {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    batch: vi.fn().mockResolvedValue(undefined),
  };
}

async function setupWithUser() {
  const db = createInMemoryDb();
  await runMigrations(db, migrations);
  await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
    "user-1", "test@example.com", new Date().toISOString(),
  ]);
  return { db };
}

describe("saveItems", () => {
  it("returns false when user does not exist", async () => {
    const { db } = await setupWithUser();

    const ok = await saveItems(db, "nonexistent", [makeItem()]);

    expect(ok).toBe(false);
  });

  it("saves items and returns true when user exists", async () => {
    const { db } = await setupWithUser();

    const ok = await saveItems(db, "user-1", [makeItem()]);

    expect(ok).toBe(true);
    const { rows } = await db.execute("SELECT * FROM intake_items WHERE id = ?", ["item-1"]);
    expect(rows).toHaveLength(1);
  });
});

describe("updateItem", () => {
  it("normalizes protein null to undefined before calling repository", async () => {
    const spy = vi.spyOn(ItemRepository, "updateItem").mockResolvedValue(undefined);
    const db = makeDb();
    const now = new Date().toISOString();

    await updateItem(db, "user-1", "item-1", { protein: null, updatedAt: now });

    const patch = spy.mock.calls[0][3];
    expect(patch.protein).toBeUndefined();
    spy.mockRestore();
  });

  it("passes protein through unchanged when it is a number", async () => {
    const spy = vi.spyOn(ItemRepository, "updateItem").mockResolvedValue(undefined);
    const db = makeDb();
    const now = new Date().toISOString();

    await updateItem(db, "user-1", "item-1", { protein: 20, updatedAt: now });

    const patch = spy.mock.calls[0][3];
    expect(patch.protein).toBe(20);
    spy.mockRestore();
  });
});

describe("deleteItem", () => {
  it("delegates to the repository", async () => {
    const spy = vi.spyOn(ItemRepository, "deleteItem").mockResolvedValue(undefined);
    const db = makeDb();

    await deleteItem(db, "user-1", "item-1");

    expect(spy).toHaveBeenCalledWith(db, "user-1", "item-1");
    spy.mockRestore();
  });
});
