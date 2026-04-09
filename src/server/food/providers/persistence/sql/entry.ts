import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import type { IntakeEntry } from "@/server/food/core/models/food";

export async function getEntriesByUserId(db: SqlDb, userId: string): Promise<IntakeEntry[]> {
  const { rows } = await db.execute(
    "SELECT id, input_text, output_text, parsed_items, created_at FROM intake_entries WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows.map((row) => ({
    id: row.id as string,
    inputText: row.input_text as string,
    outputText: row.output_text as string | undefined,
    parsedItems: JSON.parse(row.parsed_items as string),
    createdAt: row.created_at as string,
  }));
}

export async function save(db: SqlDb, entry: IntakeEntry, userId?: string): Promise<void> {
  await db.execute(
    `INSERT INTO intake_entries (id, input_text, output_text, parsed_items, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id WHERE user_id IS NULL`,
    [
      entry.id,
      entry.inputText,
      entry.outputText ?? null,
      JSON.stringify(entry.parsedItems),
      entry.createdAt,
      userId ?? null,
    ]
  );
}
