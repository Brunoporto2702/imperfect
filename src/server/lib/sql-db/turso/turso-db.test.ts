import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "./in-memory-db";

describe("TursoDb", () => {
  it("executes a query and returns rows", async () => {
    const db = createInMemoryDb();
    await db.execute("CREATE TABLE test (id TEXT, value TEXT)");
    await db.execute("INSERT INTO test VALUES (?, ?)", ["1", "hello"]);

    const { rows } = await db.execute("SELECT * FROM test");

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("1");
    expect(rows[0].value).toBe("hello");
  });

  it("returns empty rows when table is empty", async () => {
    const db = createInMemoryDb();
    await db.execute("CREATE TABLE test (id TEXT)");

    const { rows } = await db.execute("SELECT * FROM test");

    expect(rows).toHaveLength(0);
  });

  it("each instance is isolated", async () => {
    const db1 = createInMemoryDb();
    const db2 = createInMemoryDb();

    await db1.execute("CREATE TABLE test (id TEXT)");
    await db1.execute("INSERT INTO test VALUES (?)", ["only-in-db1"]);

    await expect(db2.execute("SELECT * FROM test")).rejects.toThrow();
  });
});
