"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { IntakeEntry, IntakeItem } from "@/server/core/models/food";
import { loadIntakeEntries } from "@/client/features/entries/intakeEntries";
import { loadIntakeItems, deleteIntakeItemsByProcessingId } from "@/client/features/entries/intakeItems";
import { loadTarget, saveTarget } from "@/client/features/profile/target";
import { getWeeklyStats } from "@/client/logic/entries";
import { buildWeeklyChart } from "@/client/logic/chart";
import { EntryCard } from "@/client/components/EntryCard";
import { WeeklyCaloriesChart } from "@/client/components/WeeklyCaloriesChart";

export function DashboardPage() {
  const [entries, setEntries] = useState<IntakeEntry[]>([]);
  const [items, setItems] = useState<IntakeItem[]>([]);
  const searchParams = useSearchParams();
  const [savedBanner, setSavedBanner] = useState(searchParams.get("saved") === "1");
  const [target, setTarget] = useState<number | null>(null);
  const [targetInput, setTargetInput] = useState("");

  useEffect(() => {
    setEntries(loadIntakeEntries());
    setItems(loadIntakeItems());
    const stored = loadTarget();
    setTarget(stored);
    setTargetInput(stored != null ? String(stored) : "");
  }, []);

  function handleDelete(processingId: string) {
    deleteIntakeItemsByProcessingId(processingId);
    setEntries((prev) => prev.filter((e) => e.id !== processingId));
    setItems((prev) => prev.filter((item) => item.processingId !== processingId));
  }

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
  const chartDays = buildWeeklyChart(items);

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      {savedBanner && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 text-sm rounded px-4 py-2.5 mb-6">
          <span>Entry saved.</span>
          <button
            onClick={() => setSavedBanner(false)}
            className="text-green-600 hover:text-green-800 ml-4 text-base leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Imperfect</h1>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <p className="text-4xl">🍽️</p>
          <p className="text-lg font-semibold">Nothing tracked yet</p>
          <p className="text-sm text-zinc-500 max-w-xs">
            Log your first meal and get an instant calorie and protein estimate.
          </p>
          <Link
            href="/new"
            className="mt-2 bg-black text-white rounded px-5 py-2.5 text-sm hover:bg-zinc-800 transition-colors"
          >
            Add first meal
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg p-5 mb-8">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">
              This week
            </h2>
            <div className="flex gap-8">
              <div>
                <p className="text-xl font-semibold">
                  {weekly.calMin}–{weekly.calMax}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">kcal</p>
              </div>
              {weekly.protein > 0 && (
                <div>
                  <p className="text-xl font-semibold">{weekly.protein}g</p>
                  <p className="text-xs text-zinc-500 mt-0.5">protein</p>
                </div>
              )}
              <div>
                <p className="text-xl font-semibold">{weekly.count}</p>
                <p className="text-xs text-zinc-500 mt-0.5">entries</p>
              </div>
            </div>
          </div>

          <div className="px-1 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Calories / day
              </p>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-zinc-400" htmlFor="daily-target">
                  Target
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

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-zinc-500">History</h2>
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                items={items.filter((item) => item.processingId === entry.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      <Link
        href="/new"
        aria-label="Add entry"
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-zinc-800 transition-colors"
      >
        +
      </Link>
    </main>
  );
}
