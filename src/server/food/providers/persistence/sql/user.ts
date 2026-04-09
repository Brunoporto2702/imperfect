import { randomUUID } from "crypto";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import type { User } from "@/server/food/core/models/user";

export async function findUserByEmail(db: SqlDb, email: string): Promise<User | null> {
  const { rows } = await db.execute(
    "SELECT id, email, created_at FROM users WHERE email = ?",
    [email]
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id as string, email: row.email as string, createdAt: row.created_at as string };
}

export async function createUser(db: SqlDb, email: string): Promise<User> {
  const user: User = { id: randomUUID(), email, createdAt: new Date().toISOString() };
  await db.execute(
    "INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)",
    [user.id, user.email, user.createdAt]
  );
  return user;
}

export async function findUserById(db: SqlDb, id: string): Promise<User | null> {
  const { rows } = await db.execute(
    "SELECT id, email, created_at FROM users WHERE id = ?",
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id as string, email: row.email as string, createdAt: row.created_at as string };
}
