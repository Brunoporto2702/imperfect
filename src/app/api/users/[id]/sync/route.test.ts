import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { createHandler } from "./route";
import { save as saveEntry } from "@/server/food/providers/persistence/sql/entry";
import { saveItems } from "@/server/food/providers/persistence/sql/item";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";

function makeRequest(userId: string) {
  return new NextRequest(`http://localhost/api/users/${userId}/sync`);
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeEntry(overrides?: Partial<IntakeEntry>): IntakeEntry {
  return {
    id: "entry-1",
    inputText: "two eggs",
    parsedItems: [],
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
  return { db };
}

describe("GET /api/users/[id]/sync", () => {
  it("returns 404 when user does not exist", async () => {
    const { db } = await setup();
    const GET = createHandler(db);

    const res = await GET(makeRequest("unknown"), makeParams("unknown"));

    expect(res.status).toBe(404);
  });

  it("returns 200 with entries and items for the user", async () => {
    const { db } = await setup();
    await saveEntry(db, makeEntry(), "user-1");
    await saveItems(db, "user-1", [makeItem()]);
    const GET = createHandler(db);

    const res = await GET(makeRequest("user-1"), makeParams("user-1"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(1);
    expect(body.items).toHaveLength(1);
  });

  it("returns empty arrays when user has no data", async () => {
    const { db } = await setup();
    const GET = createHandler(db);

    const res = await GET(makeRequest("user-1"), makeParams("user-1"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(0);
    expect(body.items).toHaveLength(0);
  });
});
