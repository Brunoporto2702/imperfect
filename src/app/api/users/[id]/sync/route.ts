import { NextRequest, NextResponse } from "next/server";
import { TursoDb } from "@/server/lib/sql-db/turso/turso-db";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import { getUserSyncData } from "@/server/food/core/services/sync";

const db = new TursoDb({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export function createHandler(db: SqlDb) {
  return async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;

    const data = await getUserSyncData(db, id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  };
}

export const GET = createHandler(db);
