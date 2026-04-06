"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";
import { loadIntakeEntries } from "@/client/features/entries/intakeEntries";
import { loadIntakeItems } from "@/client/features/entries/intakeItems";
import { loadTarget, saveTarget } from "@/client/features/profile/target";
import { getWeeklyStats, getDaySummaries, getWeeklyInsight } from "@/client/logic/entries";
import { buildWeeklyChart } from "@/client/logic/chart";
import { WeeklyCaloriesChart } from "@/client/components/WeeklyCaloriesChart";

const SENTIMENT_STYLES = {
  positive: "text-green-600",
  warning: "text-amber-500",
  neutral: "text-zinc-400",
};

export function DashboardPage() {
  const [entries, setEntries] = useState<IntakeEntry[]>([]);
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [target, setTarget] = useState<number | null>(null);
  const [targetInput, setTargetInput] = useState("");

  useEffect(() => {
    setEntries(loadIntakeEntries());
    setItems(loadIntakeItems());
    const stored = loadTarget();
    setTarget(stored);
    setTargetInput(stored != null ? String(stored) : "");
  }, []);

  function handleTargetBlur() {
    const parsed = parseInt(targetInput, 10);
    if (!targetInput.trim() || isNaN(parsed) || parsed <= 0) {
      saveTarget(null);
      setTarget(null);
      setTargetInput("");
    } else {
      saveTarget(parsed);
      setTarget(parsed);
    }
  }

  const weekly = getWeeklyStats(items);
  const insight = getWeeklyInsight(items, target);
  const chartDays = buildWeeklyChart(items);
  const daySummaries = getDaySummaries(items);

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      {entries.length === 0 ? (
        <div className="flex flex-col items-start justify-center py-20 gap-4 max-w-xs">
          <p className="text-2xl font-bold leading-snug">Rastreie sem obsessão.</p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Descreva o que comeu como vier na cabeça — texto livre, foto, ou item a item.
            A gente estima calorias e proteína. Sem pesagem, sem tabela.
          </p>
          <Link
            href="/new/text"
            className="mt-2 bg-black text-white rounded px-5 py-2.5 text-sm hover:bg-zinc-800 transition-colors"
          >
            Registrar primeira refeição
          </Link>
        </div>
      ) : (
        <>
          {/* Weekly stats + insight */}
          <div className="border rounded-lg p-5 mb-8">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">
              Esta semana
            </h2>
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-xl font-semibold">{weekly.calMin}–{weekly.calMax}</p>
                <p className="text-xs text-zinc-500 mt-0.5">kcal</p>
              </div>
              {weekly.protein > 0 && (
                <div>
                  <p className="text-xl font-semibold">{weekly.protein}g</p>
                  <p className="text-xs text-zinc-500 mt-0.5">proteína</p>
                </div>
              )}
              <div>
                <p className="text-xl font-semibold">{weekly.count}</p>
                <p className="text-xs text-zinc-500 mt-0.5">itens</p>
              </div>
            </div>
            <p className={`text-xs ${SENTIMENT_STYLES[insight.sentiment]}`}>
              {insight.message}
            </p>
          </div>

          {/* Chart */}
          <div className="px-1 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Calorias / dia
              </p>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-zinc-400" htmlFor="daily-target">
                  Meta
                </label>
                <input
                  id="daily-target"
                  type="number"
                  min={1}
                  placeholder="kcal"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onBlur={handleTargetBlur}
                  className="w-20 text-xs border rounded px-2 py-1 text-right text-blue-500 placeholder:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
            </div>
            <WeeklyCaloriesChart days={chartDays} target={target ?? undefined} />
          </div>

          {/* Day summaries */}
          <div className="flex flex-col gap-6">
            {daySummaries.map((day) => (
              <div key={day.dateKey}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-semibold">{day.label}</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-zinc-400">
                      {day.calMin}–{day.calMax} kcal
                    </span>
                    <Link href="/items" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                      Editar
                    </Link>
                  </div>
                </div>
                <ul className="flex flex-col gap-1">
                  {day.items.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between text-sm">
                      <span className="text-zinc-700">
                        {item.quantity} {item.name}
                      </span>
                      <span className="text-xs text-zinc-400 ml-4 shrink-0">
                        {item.caloriesMin}–{item.caloriesMax} kcal
                        {item.protein != null && ` · ${item.protein}g`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <Link
        href="/new"
        aria-label="Nova entrada"
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-zinc-800 transition-colors"
      >
        +
      </Link>
    </main>
  );
}
