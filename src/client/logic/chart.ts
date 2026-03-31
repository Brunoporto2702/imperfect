import type { FoodEntry } from "@/server/core/models/food";

export type DayBar = {
  label: string;
  calMin: number;
  calMax: number;
  calMid: number;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function buildWeeklyChart(entries: FoodEntry[]): DayBar[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));

    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const dayEntries = entries.filter((e) => {
      const d = new Date(e.createdAt);
      return d >= date && d < next;
    });

    const calMin = dayEntries.reduce((s, e) => s + e.totalCaloriesMin, 0);
    const calMax = dayEntries.reduce((s, e) => s + e.totalCaloriesMax, 0);

    return {
      label: DAY_LABELS[date.getDay()],
      calMin,
      calMax,
      calMid: Math.round((calMin + calMax) / 2),
    };
  });
}
