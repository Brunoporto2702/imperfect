import type { Migration } from "@/server/lib/sql-db/migration-runner";

export const migrations: Migration[] = [
  {
    name: "001_create_entries",
    sql: `
      CREATE TABLE IF NOT EXISTS intake_entries (
        id           TEXT PRIMARY KEY,
        input_text   TEXT NOT NULL,
        output_text  TEXT,
        parsed_items TEXT NOT NULL,
        created_at   TEXT NOT NULL
      )
    `,
  },
];
