"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { FoodEntry } from "@/server/core/models/food";
import { loadHistory } from "@/client/features/entries/history";
import { EntryCard } from "@/client/components/EntryCard";

function getWeeklyStats(entries: FoodEntry[]) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const week = entries.filter((e) => new Date(e.createdAt) >= weekAgo);

  return {
    count: week.length,
    calMin: week.reduce((s, e) => s + e.totalCaloriesMin, 0),
    calMax: week.reduce((s, e) => s + e.totalCaloriesMax, 0),
    protein: week.reduce((s, e) => s + (e.totalProtein ?? 0), 0),
  };
}

export function DashboardPage() {
  const [history, setHistory] = useState<FoodEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const weekly = getWeeklyStats(history);

  return (
    <main className="max-w-xl mx-auto p-8 pb-28">
      <h1 className="text-2xl font-bold mb-6">Imperfect</h1>

      <div className="border rounded-lg p-5 mb-8">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">
          This week
        </h2>
        {weekly.count === 0 ? (
          <p className="text-sm text-zinc-400">No entries yet. Add your first meal.</p>
        ) : (
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
        )}
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-zinc-500">History</h2>
          {history.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
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
