import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TursoDb } from "@/server/lib/sql-db/turso/turso-db";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import { findOrCreateUser } from "@/server/food/core/services/user";

const db = new TursoDb({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const BodySchema = z.object({ email: z.string().email() });

export function createHandler(db: SqlDb) {
  return async function POST(request: NextRequest) {
    const body = await request.json();
    const result = BodySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { user, isNew } = await findOrCreateUser(db, result.data.email);
    return NextResponse.json({ userId: user.id, isNew });
  };
}

export const POST = createHandler(db);
