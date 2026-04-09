import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TursoDb } from "@/server/lib/sql-db/turso/turso-db";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import { IntakeEntrySchema, IntakeItemSchema } from "@/server/food/core/models/food";
import { migrateUserData } from "@/server/food/core/services/sync";

const db = new TursoDb({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const BodySchema = z.object({
  entries: z.array(IntakeEntrySchema),
  items: z.array(IntakeItemSchema),
});

export function createHandler(db: SqlDb) {
  return async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;

    const body = await request.json();
    const result = BodySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const ok = await migrateUserData(db, id, result.data.entries, result.data.items);
    if (!ok) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  };
}

export const POST = createHandler(db);
