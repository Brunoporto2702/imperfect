import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { createHandler } from "./route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function setup() {
  const db = createInMemoryDb();
  await runMigrations(db, migrations);
  return { db };
}

describe("POST /api/users", () => {
  it("creates a new user and returns isNew=true", async () => {
    const { db } = await setup();
    const POST = createHandler(db);

    const res = await POST(makeRequest({ email: "new@example.com" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isNew).toBe(true);
    expect(body.userId).toBeTruthy();
  });

  it("returns the existing user and isNew=false for a known email", async () => {
    const { db } = await setup();
    const POST = createHandler(db);
    const first = await (await POST(makeRequest({ email: "existing@example.com" }))).json();

    const res = await POST(makeRequest({ email: "existing@example.com" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isNew).toBe(false);
    expect(body.userId).toBe(first.userId);
  });

  it("returns 400 for an invalid email", async () => {
    const { db } = await setup();
    const POST = createHandler(db);

    const res = await POST(makeRequest({ email: "not-an-email" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const { db } = await setup();
    const POST = createHandler(db);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });
});
