import { describe, it, expect } from "vitest";
import { createInMemoryDb } from "@/server/lib/sql-db/turso/in-memory-db";
import { runMigrations } from "@/server/lib/sql-db/migration-runner";
import { migrations } from "@/server/food/migrations/index";
import { createUser, findUserByEmail, findUserById } from "./user";

async function setup() {
  const db = createInMemoryDb();
  await runMigrations(db, migrations);
  return { db };
}

describe("sql/user", () => {
  describe("createUser", () => {
    it("inserts a user and returns it", async () => {
      const { db } = await setup();

      const user = await createUser(db, "test@example.com");

      expect(user.email).toBe("test@example.com");
      expect(user.id).toBeTruthy();
      expect(user.createdAt).toBeTruthy();
    });

    it("persists the user to the database", async () => {
      const { db } = await setup();

      const user = await createUser(db, "test@example.com");

      const { rows } = await db.execute("SELECT * FROM users WHERE id = ?", [user.id]);
      expect(rows).toHaveLength(1);
      expect(rows[0].email).toBe("test@example.com");
    });
  });

  describe("findUserByEmail", () => {
    it("returns the user when the email exists", async () => {
      const { db } = await setup();
      const created = await createUser(db, "test@example.com");

      const found = await findUserByEmail(db, "test@example.com");

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.email).toBe("test@example.com");
    });

    it("returns null when the email does not exist", async () => {
      const { db } = await setup();

      const found = await findUserByEmail(db, "missing@example.com");

      expect(found).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("returns the user when the id exists", async () => {
      const { db } = await setup();
      const created = await createUser(db, "test@example.com");

      const found = await findUserById(db, created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it("returns null when the id does not exist", async () => {
      const { db } = await setup();

      const found = await findUserById(db, "nonexistent-id");

      expect(found).toBeNull();
    });
  });
});
