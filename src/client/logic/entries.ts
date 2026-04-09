import type { IntakeItem } from "@/server/food/core/models/food";

function localDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("sv");
}

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
    const dateKey = localDateKey(item.consumedAt);
    if (!byDay.has(dateKey)) byDay.set(dateKey, []);
    byDay.get(dateKey)!.push(item);
  }

  const today = new Date().toLocaleDateString("sv");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("sv");

  return Array.from(byDay.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, dayItems]) => {
      let label: string;
      if (dateKey === today) label = "Hoje";
      else if (dateKey === yesterday) label = "Ontem";
      else {
        const d = new Date(dateKey + "T12:00:00");
        label = d.toLocaleDateString("pt-BR", { weekday: "short", month: "short", day: "numeric" });
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
    return { message: "Registre refeições para ver o insight da semana.", sentiment: "neutral" };
  }

  const days = new Set(weekItems.map((item) => localDateKey(item.consumedAt)));
  const dailyMids = Array.from(days).map((day) => {
    const dayItems = weekItems.filter((item) => localDateKey(item.consumedAt) === day);
    const calMin = dayItems.reduce((s, i) => s + i.caloriesMin, 0);
    const calMax = dayItems.reduce((s, i) => s + i.caloriesMax, 0);
    return Math.round((calMin + calMax) / 2);
  });

  const avgDaily = Math.round(dailyMids.reduce((s, v) => s + v, 0) / dailyMids.length);

  if (target == null) {
    return {
      message: `Média de ~${avgDaily} kcal/dia. Defina uma meta para insights personalizados.`,
      sentiment: "neutral",
    };
  }

  const diff = avgDaily - target;
  const ratio = diff / target;

  if (ratio > 0.1) {
    return {
      message: `Média de ~${avgDaily} kcal/dia — ~${diff} acima da meta. Que tal opções mais leves?`,
      sentiment: "warning",
    };
  }
  if (ratio < -0.1) {
    return {
      message: `Média de ~${avgDaily} kcal/dia — ~${Math.abs(diff)} abaixo da meta. Tem espaço pra mais.`,
      sentiment: "positive",
    };
  }
  return {
    message: `No caminho certo — ~${avgDaily} kcal/dia, próximo da meta de ${target} kcal.`,
    sentiment: "positive",
  };
}
