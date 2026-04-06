import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import type { IntakeEntry } from "@/server/food/core/models/food";

export async function save(db: SqlDb, entry: IntakeEntry): Promise<void> {
  await db.execute(
    `INSERT INTO intake_entries (id, input_text, output_text, parsed_items, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.inputText,
      entry.outputText ?? null,
      JSON.stringify(entry.parsedItems),
      entry.createdAt,
    ]
  );
}
