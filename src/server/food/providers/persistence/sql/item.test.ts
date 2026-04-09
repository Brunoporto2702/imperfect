import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { saveItems, updateItem, deleteItem, getItemsByUserId } from "./item";
import type { IntakeItem } from "@/server/food/core/models/food";

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
  await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
    "user-1", "test@example.com", new Date().toISOString(),
  ]);
  await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
    "user-2", "other@example.com", new Date().toISOString(),
  ]);
  return { db };
}

describe("sql/item", () => {
  describe("saveItems", () => {
    it("inserts items into the database", async () => {
      const { db } = await setup();

      await saveItems(db, "user-1", [makeItem()]);

      const { rows } = await db.execute("SELECT * FROM intake_items WHERE id = ?", ["item-1"]);
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe("scrambled eggs");
      expect(rows[0].user_id).toBe("user-1");
    });

    it("links items to their entry via entry_id", async () => {
      const { db } = await setup();
      await db.execute(
        "INSERT INTO intake_entries (id, input_text, parsed_items, created_at, user_id) VALUES (?, ?, ?, ?, ?)",
        ["entry-1", "two eggs", "[]", new Date().toISOString(), "user-1"]
      );

      await saveItems(db, "user-1", [makeItem({ processingId: "entry-1" })]);

      const { rows } = await db.execute("SELECT entry_id FROM intake_items WHERE id = ?", ["item-1"]);
      expect(rows[0].entry_id).toBe("entry-1");
    });

    it("saves protein as null when undefined", async () => {
      const { db } = await setup();

      await saveItems(db, "user-1", [makeItem({ id: "item-2", protein: undefined })]);

      const { rows } = await db.execute("SELECT protein FROM intake_items WHERE id = ?", ["item-2"]);
      expect(rows[0].protein).toBeNull();
    });

    it("is idempotent — ignores duplicate ids", async () => {
      const { db } = await setup();

      await saveItems(db, "user-1", [makeItem()]);
      await saveItems(db, "user-1", [makeItem()]);

      const { rows } = await db.execute("SELECT * FROM intake_items WHERE id = ?", ["item-1"]);
      expect(rows).toHaveLength(1);
    });

    it("does nothing when given an empty array", async () => {
      const { db } = await setup();

      await saveItems(db, "user-1", []);

      const { rows } = await db.execute("SELECT * FROM intake_items");
      expect(rows).toHaveLength(0);
    });
  });

  describe("getItemsByUserId", () => {
    it("returns items belonging to the user", async () => {
      const { db } = await setup();
      await saveItems(db, "user-1", [makeItem({ id: "i1" }), makeItem({ id: "i2" })]);

      const items = await getItemsByUserId(db, "user-1");

      expect(items).toHaveLength(2);
      expect(items.map((i) => i.id)).toContain("i1");
      expect(items.map((i) => i.id)).toContain("i2");
    });

    it("does not return items belonging to another user", async () => {
      const { db } = await setup();
      await saveItems(db, "user-1", [makeItem({ id: "i1" })]);
      await saveItems(db, "user-2", [makeItem({ id: "i2" })]);

      const items = await getItemsByUserId(db, "user-1");

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("i1");
    });

    it("returns empty array when user has no items", async () => {
      const { db } = await setup();

      const items = await getItemsByUserId(db, "user-1");

      expect(items).toHaveLength(0);
    });
  });

  describe("updateItem", () => {
    it("updates specified fields", async () => {
      const { db } = await setup();
      await saveItems(db, "user-1", [makeItem()]);

      await updateItem(db, "user-1", "item-1", { name: "fried eggs", caloriesMin: 160 });

      const { rows } = await db.execute("SELECT name, calories_min FROM intake_items WHERE id = ?", ["item-1"]);
      expect(rows[0].name).toBe("fried eggs");
      expect(rows[0].calories_min).toBe(160);
    });

    it("does not update items belonging to another user", async () => {
      const { db } = await setup();
      await saveItems(db, "user-1", [makeItem()]);

      await updateItem(db, "user-2", "item-1", { name: "fried eggs" });

      const { rows } = await db.execute("SELECT name FROM intake_items WHERE id = ?", ["item-1"]);
      expect(rows[0].name).toBe("scrambled eggs");
    });
  });

  describe("deleteItem", () => {
    it("removes the item from the database", async () => {
      const { db } = await setup();
      await saveItems(db, "user-1", [makeItem()]);

      await deleteItem(db, "user-1", "item-1");

      const { rows } = await db.execute("SELECT * FROM intake_items WHERE id = ?", ["item-1"]);
      expect(rows).toHaveLength(0);
    });

    it("does not delete items belonging to another user", async () => {
      const { db } = await setup();
      await saveItems(db, "user-1", [makeItem()]);

      await deleteItem(db, "user-2", "item-1");

      const { rows } = await db.execute("SELECT * FROM intake_items WHERE id = ?", ["item-1"]);
      expect(rows).toHaveLength(1);
    });
  });
});
