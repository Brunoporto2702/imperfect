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
  positive: "text-green-400",
  warning: "text-amber-400",
  neutral: "text-zinc-500",
};

export function DashboardPage() {
  const [loaded, setLoaded] = useState(false);
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
    setLoaded(true);
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

  if (!loaded) return null;

  const weekly = getWeeklyStats(items);
  const insight = getWeeklyInsight(items, target);
  const chartDays = buildWeeklyChart(items);
  const daySummaries = getDaySummaries(items);

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center text-center py-24 gap-5 max-w-sm mx-auto">
          <p className="text-3xl font-bold text-zinc-50 leading-snug">Rastreie sem obsessão.</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Descreva o que comeu como vier na cabeça — texto livre, foto, ou item a item.
            A gente estima calorias e proteína. Sem pesagem, sem tabela.
          </p>
          <Link
            href="/new"
            className="mt-2 bg-zinc-100 text-zinc-900 hover:bg-white transition-colors rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            Registrar primeira refeição
          </Link>
        </div>
      ) : (
        <>
          {/* Weekly stats */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-8">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">
              Esta semana
            </h2>
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-2xl font-bold text-zinc-50">{weekly.calMin}–{weekly.calMax}</p>
                <p className="text-xs text-zinc-500 mt-0.5">kcal</p>
              </div>
              {weekly.protein > 0 && (
                <div>
                  <p className="text-2xl font-bold text-zinc-50">{weekly.protein}g</p>
                  <p className="text-xs text-zinc-500 mt-0.5">proteína</p>
                </div>
              )}
              <div>
                <p className="text-2xl font-bold text-zinc-50">{weekly.count}</p>
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
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                Calorias / dia
              </p>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-zinc-600" htmlFor="daily-target">
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
                  style={{ colorScheme: "dark" }}
                  className="w-20 text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-right text-blue-400 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
            <WeeklyCaloriesChart days={chartDays} target={target ?? undefined} />
          </div>

          {/* Day summaries */}
          <div className="flex flex-col">
            {daySummaries.map((day, idx) => (
              <div key={day.dateKey} className={idx > 0 ? "border-t border-zinc-800/50 pt-5 mt-5" : ""}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-semibold text-zinc-50">{day.label}</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-zinc-600">
                      {day.calMin}–{day.calMax} kcal
                    </span>
                    <Link href="/items" className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors">
                      Editar
                    </Link>
                  </div>
                </div>
                <ul className="flex flex-col gap-1">
                  {day.items.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between text-sm">
                      <span className="text-zinc-400">
                        {item.quantity} {item.name}
                      </span>
                      <span className="text-xs text-zinc-600 ml-4 shrink-0">
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-100 text-zinc-900 hover:bg-white rounded-full flex items-center justify-center text-2xl shadow-lg transition-colors"
      >
        +
      </Link>
    </main>
  );
}
