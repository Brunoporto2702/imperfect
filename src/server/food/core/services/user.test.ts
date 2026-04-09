import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { findOrCreateUser } from "./user";

async function setup() {
  const db = createInMemoryDb();
  await runMigrations(db, migrations);
  return { db };
}

describe("findOrCreateUser", () => {
  it("creates a new user and returns isNew=true when email is not found", async () => {
    const { db } = await setup();

    const { user, isNew } = await findOrCreateUser(db, "new@example.com");

    expect(isNew).toBe(true);
    expect(user.email).toBe("new@example.com");
    expect(user.id).toBeTruthy();
  });

  it("returns the existing user and isNew=false when email already exists", async () => {
    const { db } = await setup();
    const { user: created } = await findOrCreateUser(db, "existing@example.com");

    const { user, isNew } = await findOrCreateUser(db, "existing@example.com");

    expect(isNew).toBe(false);
    expect(user.id).toBe(created.id);
    expect(user.email).toBe("existing@example.com");
  });

  it("does not create a duplicate user on repeated calls", async () => {
    const { db } = await setup();

    await findOrCreateUser(db, "test@example.com");
    await findOrCreateUser(db, "test@example.com");

    const { rows } = await db.execute("SELECT * FROM users WHERE email = ?", ["test@example.com"]);
    expect(rows).toHaveLength(1);
  });
});
