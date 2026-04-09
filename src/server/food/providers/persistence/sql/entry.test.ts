import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { save, getEntriesByUserId } from "./entry";
import type { IntakeEntry } from "@/server/food/core/models/food";

function makeEntry(overrides?: Partial<IntakeEntry>): IntakeEntry {
  return {
    id: "entry-1",
    inputText: "two eggs",
    outputText: '{"items":[]}',
    parsedItems: [
      { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
    ],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function setup() {
  const db = createInMemoryDb();
  await runMigrations(db, migrations);
  return { db };
}

describe("sql/entry", () => {
  it("saves entry with user_id when provided", async () => {
    const { db } = await setup();
    await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
      "user-1", "test@example.com", new Date().toISOString(),
    ]);
    const entry = makeEntry();

    await save(db, entry, "user-1");

    const { rows } = await db.execute("SELECT user_id FROM intake_entries WHERE id = ?", [entry.id]);
    expect(rows[0].user_id).toBe("user-1");
  });

  it("saves entry with null user_id when userId is not provided", async () => {
    const { db } = await setup();
    const entry = makeEntry();

    await save(db, entry);

    const { rows } = await db.execute("SELECT user_id FROM intake_entries WHERE id = ?", [entry.id]);
    expect(rows[0].user_id).toBeNull();
  });

  it("ignores duplicate entry (INSERT OR IGNORE)", async () => {
    const { db } = await setup();
    const entry = makeEntry();

    await save(db, entry);
    await save(db, entry);

    const { rows } = await db.execute("SELECT * FROM intake_entries WHERE id = ?", [entry.id]);
    expect(rows).toHaveLength(1);
  });

  it("getEntriesByUserId returns entries for the user", async () => {
    const { db } = await setup();
    await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
      "user-1", "test@example.com", new Date().toISOString(),
    ]);
    await save(db, makeEntry({ id: "e1" }), "user-1");
    await save(db, makeEntry({ id: "e2" }), "user-1");

    const entries = await getEntriesByUserId(db, "user-1");
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.id)).toContain("e1");
    expect(entries.map((e) => e.id)).toContain("e2");
  });

  it("getEntriesByUserId does not return entries from another user", async () => {
    const { db } = await setup();
    await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
      "user-1", "a@example.com", new Date().toISOString(),
    ]);
    await db.execute("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)", [
      "user-2", "b@example.com", new Date().toISOString(),
    ]);
    await save(db, makeEntry({ id: "e1" }), "user-1");
    await save(db, makeEntry({ id: "e2" }), "user-2");

    const entries = await getEntriesByUserId(db, "user-1");
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("e1");
  });

  it("getEntriesByUserId returns empty array when user has no entries", async () => {
    const { db } = await setup();
    const entries = await getEntriesByUserId(db, "unknown-user");
    expect(entries).toHaveLength(0);
  });

  it("saves an entry to the database", async () => {
    const { db } = await setup();
    const entry = makeEntry();

    await save(db, entry);

    const { rows } = await db.execute("SELECT * FROM intake_entries WHERE id = ?", [entry.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("entry-1");
    expect(rows[0].input_text).toBe("two eggs");
  });

  it("persists parsed_items as JSON", async () => {
    const { db } = await setup();
    const entry = makeEntry();

    await save(db, entry);

    const { rows } = await db.execute("SELECT parsed_items FROM intake_entries WHERE id = ?", [entry.id]);
    const parsed = JSON.parse(rows[0].parsed_items as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("scrambled eggs");
  });

  it("saves output_text as null when undefined", async () => {
    const { db } = await setup();
    const entry = makeEntry({ outputText: undefined });

    await save(db, entry);

    const { rows } = await db.execute("SELECT output_text FROM intake_entries WHERE id = ?", [entry.id]);
    expect(rows[0].output_text).toBeNull();
  });
});
