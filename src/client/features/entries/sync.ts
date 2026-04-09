import { post, patch, del } from "@/client/infra/http";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";

type SyncData = { entries: IntakeEntry[]; items: IntakeItem[] };

export function syncItemsToCloud(userId: string, items: IntakeItem[]): Promise<{ ok: boolean }> {
  return post("/api/items", { userId, items });
}

export function migrateToCloud(userId: string, entries: IntakeEntry[], items: IntakeItem[]): Promise<{ ok: boolean }> {
  return post(`/api/users/${userId}/migrate`, { entries, items });
}

export function fetchUserData(userId: string): Promise<SyncData> {
  return fetch(`/api/users/${userId}/sync`).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Request failed: ${res.status}`);
    }
    return res.json();
  });
}

export function registerUser(email: string): Promise<{ userId: string; isNew: boolean }> {
  return post("/api/users", { email });
}

export function patchItemOnCloud(userId: string, item: IntakeItem): Promise<{ ok: boolean }> {
  return patch(`/api/items/${item.id}`, {
    userId,
    name: item.name,
    quantity: item.quantity,
    caloriesMin: item.caloriesMin,
    caloriesMax: item.caloriesMax,
    protein: item.protein ?? null,
    consumedAt: item.consumedAt,
    editedByUser: item.editedByUser,
    updatedAt: item.updatedAt,
  });
}

export function deleteItemOnCloud(userId: string, itemId: string): Promise<{ ok: boolean }> {
  return del(`/api/items/${itemId}`, { userId });
}
