import type { IntakeItem } from "@/server/food/core/models/food";

export type DayBar = {
  label: string;
  calMin: number;
  calMax: number;
  calMid: number;
};

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function buildWeeklyChart(items: IntakeItem[]): DayBar[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));

    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const dayItems = items.filter((item) => {
      const d = new Date(item.consumedAt);
      return d >= date && d < next;
    });

    const calMin = dayItems.reduce((s, item) => s + item.caloriesMin, 0);
    const calMax = dayItems.reduce((s, item) => s + item.caloriesMax, 0);

    return {
      label: DAY_LABELS[date.getDay()],
      calMin,
      calMax,
      calMid: Math.round((calMin + calMax) / 2),
    };
  });
}
