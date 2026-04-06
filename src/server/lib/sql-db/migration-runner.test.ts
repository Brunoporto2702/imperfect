import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "./turso/in-memory-db";
import { runMigrations, type Migration } from "./migration-runner";

const createUsersTable: Migration = {
  name: "001_create_users",
  sql: "CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
};

const addEmailColumn: Migration = {
  name: "002_add_email",
  sql: "ALTER TABLE users ADD COLUMN email TEXT",
};

describe("runMigrations", () => {
  it("runs pending migrations", async () => {
    const db = createInMemoryDb();
    await runMigrations(db, [createUsersTable]);

    await db.execute("INSERT INTO users (id, name) VALUES (?, ?)", ["1", "Bruno"]);
    const { rows } = await db.execute("SELECT * FROM users");
    expect(rows).toHaveLength(1);
  });

  it("is idempotent — running twice does not fail", async () => {
    const db = createInMemoryDb();
    await runMigrations(db, [createUsersTable]);
    await runMigrations(db, [createUsersTable]);

    const { rows } = await db.execute("SELECT name FROM schema_migrations");
    expect(rows).toHaveLength(1);
  });

  it("records each migration in schema_migrations", async () => {
    const db = createInMemoryDb();
    await runMigrations(db, [createUsersTable, addEmailColumn]);

    const { rows } = await db.execute("SELECT name FROM schema_migrations ORDER BY name");
    expect(rows.map((r) => r.name)).toEqual(["001_create_users", "002_add_email"]);
  });

  it("skips already-run migrations on subsequent calls", async () => {
    const db = createInMemoryDb();
    await runMigrations(db, [createUsersTable]);
    await runMigrations(db, [createUsersTable, addEmailColumn]);

    const { rows } = await db.execute("SELECT name FROM schema_migrations ORDER BY name");
    expect(rows).toHaveLength(2);
  });
});
