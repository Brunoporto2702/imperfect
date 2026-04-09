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
  {
    name: "002_users",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id         TEXT PRIMARY KEY,
        email      TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )
    `,
  },
  {
    name: "003_add_user_id_to_entries",
    sql: `ALTER TABLE intake_entries ADD COLUMN user_id TEXT REFERENCES users(id)`,
  },
  {
    name: "004_intake_items",
    sql: `
      CREATE TABLE IF NOT EXISTS intake_items (
        id             TEXT PRIMARY KEY,
        entry_id       TEXT REFERENCES intake_entries(id),
        user_id        TEXT NOT NULL REFERENCES users(id),
        name           TEXT NOT NULL,
        quantity       TEXT NOT NULL,
        calories_min   INTEGER NOT NULL,
        calories_max   INTEGER NOT NULL,
        protein        REAL,
        consumed_at    TEXT NOT NULL,
        source         TEXT NOT NULL,
        edited_by_user INTEGER NOT NULL DEFAULT 0,
        created_at     TEXT NOT NULL,
        updated_at     TEXT NOT NULL
      )
    `,
  },
];
