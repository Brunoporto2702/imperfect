import type { FoodEntry } from "@/server/core/models/food";

export function getWeeklyStats(entries: FoodEntry[]) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const week = entries.filter((e) => new Date(e.createdAt) >= weekAgo);

  return {
    count: week.length,
    calMin: week.reduce((s, e) => s + e.totalCaloriesMin, 0),
    calMax: week.reduce((s, e) => s + e.totalCaloriesMax, 0),
    protein: week.reduce((s, e) => s + (e.totalProtein ?? 0), 0),
  };
}
