import type { SqlDb } from "./sql-db";

export type Migration = { name: string; sql: string };

export async function runMigrations(
  db: SqlDb,
  migrations: Migration[]
): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name   TEXT PRIMARY KEY,
      run_at TEXT NOT NULL
    )
  `);

  const { rows } = await db.execute("SELECT name FROM schema_migrations");
  const ran = new Set(rows.map((r) => r.name as string));

  for (const migration of migrations) {
    if (!ran.has(migration.name)) {
      await db.execute(migration.sql);
      await db.execute(
        "INSERT INTO schema_migrations (name, run_at) VALUES (?, ?)",
        [migration.name, new Date().toISOString()]
      );
    }
  }
}
