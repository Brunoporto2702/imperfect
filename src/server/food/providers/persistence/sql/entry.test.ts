import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { save } from "./entry";
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
