import { NextRequest, NextResponse } from "next/server";
import { CreateEntryRequestSchema } from "@/server/food/core/models/entry";
import { createEntry } from "@/server/food/core/services/food";
import { type AIProvider } from "@/server/food/core/logic/parser";
import { anthropicProvider } from "@/server/food/providers/ai/anthropic";
import { type SqlDb } from "@/server/lib/sql-db/sql-db";
import { TursoDb } from "@/server/lib/sql-db/turso/turso-db";

const db = new TursoDb({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export function createHandler(provider: AIProvider, db: SqlDb) {
  return async function POST(request: NextRequest) {
    const body = await request.json();

    const result = CreateEntryRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    try {
      const { intakeEntry, intakeItems } = await createEntry(result.data.rawInput, provider, db);
      return NextResponse.json({ intakeEntry, intakeItems });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse food";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export const POST = createHandler(anthropicProvider, db);
