import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { createHandler } from "./route";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";

function makeRequest(userId: string, body: unknown) {
  return new NextRequest(`http://localhost/api/users/${userId}/migrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

describe("POST /api/users/[id]/migrate", () => {
  it("saves entries and items and returns ok", async () => {
    const { db } = await setup();
    const POST = createHandler(db);
    const body = { entries: [makeEntry()], items: [makeItem()] };

    const res = await POST(makeRequest("user-1", body), makeParams("user-1"));

    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    const { rows } = await db.execute("SELECT * FROM intake_items WHERE user_id = ?", ["user-1"]);
    expect(rows).toHaveLength(1);
  });

  it("returns 404 when user does not exist", async () => {
    const { db } = await setup();
    const POST = createHandler(db);
    const body = { entries: [], items: [] };

    const res = await POST(makeRequest("unknown", body), makeParams("unknown"));

    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid body", async () => {
    const { db } = await setup();
    const POST = createHandler(db);

    const res = await POST(makeRequest("user-1", { entries: "not-an-array" }), makeParams("user-1"));

    expect(res.status).toBe(400);
  });
});
