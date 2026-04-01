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

export type DaySummary = {
  dateKey: string;
  label: string;
  items: IntakeItem[];
  calMin: number;
  calMax: number;
};

export function getDaySummaries(items: IntakeItem[]): DaySummary[] {
  const byDay = new Map<string, IntakeItem[]>();

  for (const item of items) {
    const dateKey = item.consumedAt.slice(0, 10);
    if (!byDay.has(dateKey)) byDay.set(dateKey, []);
    byDay.get(dateKey)!.push(item);
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return Array.from(byDay.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, dayItems]) => {
      let label: string;
      if (dateKey === today) label = "Today";
      else if (dateKey === yesterday) label = "Yesterday";
      else {
        const d = new Date(dateKey + "T12:00:00");
        label = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      }

      const calMin = dayItems.reduce((s, i) => s + i.caloriesMin, 0);
      const calMax = dayItems.reduce((s, i) => s + i.caloriesMax, 0);

      return { dateKey, label, items: dayItems, calMin, calMax };
    });
}

export type WeeklyInsight = {
  message: string;
  sentiment: "positive" | "warning" | "neutral";
};

export function getWeeklyInsight(
  items: IntakeItem[],
  target: number | null
): WeeklyInsight {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekItems = items.filter((item) => item.consumedAt >= weekAgo);

  if (weekItems.length === 0) {
    return { message: "Log meals to get a weekly insight.", sentiment: "neutral" };
  }

  const days = new Set(weekItems.map((item) => item.consumedAt.slice(0, 10)));
  const dailyMids = Array.from(days).map((day) => {
    const dayItems = weekItems.filter((item) => item.consumedAt.startsWith(day));
    const calMin = dayItems.reduce((s, i) => s + i.caloriesMin, 0);
    const calMax = dayItems.reduce((s, i) => s + i.caloriesMax, 0);
    return Math.round((calMin + calMax) / 2);
  });

  const avgDaily = Math.round(dailyMids.reduce((s, v) => s + v, 0) / dailyMids.length);

  if (target == null) {
    return {
      message: `Averaging ~${avgDaily} kcal/day. Set a target for personalized insights.`,
      sentiment: "neutral",
    };
  }

  const diff = avgDaily - target;
  const ratio = diff / target;

  if (ratio > 0.1) {
    return {
      message: `Averaging ~${avgDaily} kcal/day — ~${diff} over your target. Consider lighter options.`,
      sentiment: "warning",
    };
  }
  if (ratio < -0.1) {
    return {
      message: `Averaging ~${avgDaily} kcal/day — ~${Math.abs(diff)} under your target. You have room for more.`,
      sentiment: "positive",
    };
  }
  return {
    message: `On track — averaging ~${avgDaily} kcal/day, close to your ${target} kcal target.`,
    sentiment: "positive",
  };
}
