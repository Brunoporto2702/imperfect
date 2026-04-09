import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import type { IntakeItem } from "@/server/food/core/models/food";

function rowToItem(row: Record<string, unknown>): IntakeItem {
  return {
    id: row.id as string,
    name: row.name as string,
    quantity: row.quantity as string,
    caloriesMin: row.calories_min as number,
    caloriesMax: row.calories_max as number,
    protein: row.protein != null ? (row.protein as number) : undefined,
    consumedAt: row.consumed_at as string,
    source: row.source as "ai" | "manual",
    processingId: row.entry_id != null ? (row.entry_id as string) : undefined,
    editedByUser: Boolean(row.edited_by_user),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function saveItems(db: SqlDb, userId: string, items: IntakeItem[]): Promise<void> {
  if (items.length === 0) return;
  await db.batch(
    items.map((item) => ({
      query: `INSERT OR IGNORE INTO intake_items
        (id, entry_id, user_id, name, quantity, calories_min, calories_max, protein, consumed_at, source, edited_by_user, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        item.id,
        item.processingId ?? null,
        userId,
        item.name,
        item.quantity,
        item.caloriesMin,
        item.caloriesMax,
        item.protein ?? null,
        item.consumedAt,
        item.source,
        item.editedByUser ? 1 : 0,
        item.createdAt,
        item.updatedAt,
      ],
    }))
  );
}

export async function updateItem(
  db: SqlDb,
  userId: string,
  id: string,
  patch: Partial<Pick<IntakeItem, "name" | "quantity" | "caloriesMin" | "caloriesMax" | "protein" | "consumedAt" | "source" | "processingId" | "editedByUser" | "createdAt" | "updatedAt">>
): Promise<void> {
  // Full upsert when all fields are present — handles items not yet in the DB
  if (
    patch.name !== undefined &&
    patch.quantity !== undefined &&
    patch.caloriesMin !== undefined &&
    patch.caloriesMax !== undefined &&
    patch.consumedAt !== undefined &&
    patch.source !== undefined &&
    patch.createdAt !== undefined &&
    patch.updatedAt !== undefined
  ) {
    await db.execute(
      `INSERT INTO intake_items (id, user_id, entry_id, name, quantity, calories_min, calories_max, protein, consumed_at, source, edited_by_user, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         quantity = excluded.quantity,
         calories_min = excluded.calories_min,
         calories_max = excluded.calories_max,
         protein = excluded.protein,
         consumed_at = excluded.consumed_at,
         source = excluded.source,
         edited_by_user = excluded.edited_by_user,
         updated_at = excluded.updated_at`,
      [
        id,
        userId,
        patch.processingId ?? null,
        patch.name,
        patch.quantity,
        patch.caloriesMin,
        patch.caloriesMax,
        patch.protein ?? null,
        patch.consumedAt,
        patch.source,
        patch.editedByUser ? 1 : 0,
        patch.createdAt,
        patch.updatedAt,
      ] as import("@/server/lib/sql-db/sql-db").SqlParam[]
    );
    return;
  }

  // Partial update fallback
  const sets: string[] = [];
  const params: unknown[] = [];

  if (patch.name !== undefined) { sets.push("name = ?"); params.push(patch.name); }
  if (patch.quantity !== undefined) { sets.push("quantity = ?"); params.push(patch.quantity); }
  if (patch.caloriesMin !== undefined) { sets.push("calories_min = ?"); params.push(patch.caloriesMin); }
  if (patch.caloriesMax !== undefined) { sets.push("calories_max = ?"); params.push(patch.caloriesMax); }
  if ("protein" in patch) { sets.push("protein = ?"); params.push(patch.protein ?? null); }
  if (patch.consumedAt !== undefined) { sets.push("consumed_at = ?"); params.push(patch.consumedAt); }
  if (patch.editedByUser !== undefined) { sets.push("edited_by_user = ?"); params.push(patch.editedByUser ? 1 : 0); }
  if (patch.updatedAt !== undefined) { sets.push("updated_at = ?"); params.push(patch.updatedAt); }

  if (sets.length === 0) return;
  params.push(id, userId);

  await db.execute(
    `UPDATE intake_items SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    params as import("@/server/lib/sql-db/sql-db").SqlParam[]
  );
}

export async function deleteItem(db: SqlDb, userId: string, id: string): Promise<void> {
  await db.execute(
    "DELETE FROM intake_items WHERE id = ? AND user_id = ?",
    [id, userId]
  );
}

export async function getItemsByUserId(db: SqlDb, userId: string): Promise<IntakeItem[]> {
  const { rows } = await db.execute(
    "SELECT * FROM intake_items WHERE user_id = ? ORDER BY consumed_at DESC",
    [userId]
  );
  return rows.map(rowToItem);
}
