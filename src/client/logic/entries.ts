import type { IntakeItem } from "@/server/core/models/food";

export function getWeeklyStats(items: IntakeItem[]) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const week = items.filter((item) => item.consumedAt >= weekAgo);

  return {
    count: week.length,
    calMin: week.reduce((s, item) => s + item.caloriesMin, 0),
    calMax: week.reduce((s, item) => s + item.caloriesMax, 0),
    protein: week.reduce((s, item) => s + (item.protein ?? 0), 0),
  };
}
