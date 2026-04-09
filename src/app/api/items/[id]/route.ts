import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TursoDb } from "@/server/lib/sql-db/turso/turso-db";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import { updateItem, deleteItem } from "@/server/food/core/services/item";

const db = new TursoDb({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const PatchBodySchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
  quantity: z.string().optional(),
  caloriesMin: z.number().optional(),
  caloriesMax: z.number().optional(),
  protein: z.number().nullable().optional(),
  consumedAt: z.string().optional(),
  editedByUser: z.boolean().optional(),
  updatedAt: z.string().optional(),
});

const DeleteBodySchema = z.object({ userId: z.string() });

export function createHandlers(db: SqlDb) {
  return {
    PATCH: async function (
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    ) {
      const { id } = await params;
      const body = await request.json();
      const result = PatchBodySchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
      }

      const { userId, ...patch } = result.data;
      await updateItem(db, userId, id, patch);
      return NextResponse.json({ ok: true });
    },

    DELETE: async function (
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    ) {
      const { id } = await params;
      const body = await request.json();
      const result = DeleteBodySchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
      }

      await deleteItem(db, result.data.userId, id);
      return NextResponse.json({ ok: true });
    },
  };
}

const handlers = createHandlers(db);
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
