export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { TursoDb } = await import("./server/lib/sql-db/turso/turso-db");
    const { runMigrations } = await import("./server/lib/sql-db/migration-runner");
    const { migrations } = await import("./server/food/migrations/index");

    const db = new TursoDb({
      url: process.env.DATABASE_URL ?? "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    await runMigrations(db, migrations);
  }
}
