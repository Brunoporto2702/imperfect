import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { createHandlers } from "./route";
import { saveItems } from "@/server/food/providers/persistence/sql/item";
import type { IntakeItem } from "@/server/food/core/models/food";

function makePatchRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/items/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
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
  await saveItems(db, "user-1", [makeItem()]);
  return { db };
}

describe("PATCH /api/items/[id]", () => {
  it("updates the item and returns ok", async () => {
    const { db } = await setup();
    const { PATCH } = createHandlers(db);
    const now = new Date().toISOString();

    const res = await PATCH(
      makePatchRequest("item-1", { userId: "user-1", name: "fried eggs", updatedAt: now }),
      makeParams("item-1")
    );

    expect(res.status).toBe(200);
    const { rows } = await db.execute("SELECT name FROM intake_items WHERE id = ?", ["item-1"]);
    expect(rows[0].name).toBe("fried eggs");
  });

  it("returns 400 when userId is missing", async () => {
    const { db } = await setup();
    const { PATCH } = createHandlers(db);

    const res = await PATCH(
      makePatchRequest("item-1", { name: "fried eggs" }),
      makeParams("item-1")
    );

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/items/[id]", () => {
  it("deletes the item and returns ok", async () => {
    const { db } = await setup();
    const { DELETE } = createHandlers(db);

    const res = await DELETE(
      makeDeleteRequest("item-1", { userId: "user-1" }),
      makeParams("item-1")
    );

    expect(res.status).toBe(200);
    const { rows } = await db.execute("SELECT * FROM intake_items WHERE id = ?", ["item-1"]);
    expect(rows).toHaveLength(0);
  });

  it("returns 400 when userId is missing", async () => {
    const { db } = await setup();
    const { DELETE } = createHandlers(db);

    const res = await DELETE(
      makeDeleteRequest("item-1", {}),
      makeParams("item-1")
    );

    expect(res.status).toBe(400);
  });
});
