"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IntakeEntry } from "@/server/food/core/models/food";
import { loadIntakeEntries } from "@/client/features/entries/intakeEntries";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}


export function LogPage() {
  const [entries, setEntries] = useState<IntakeEntry[]>([]);

  useEffect(() => {
    setEntries(loadIntakeEntries());
  }, []);

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6 inline-block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">AI Log</h1>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-400">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {entries.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium leading-snug">{entry.inputText}</p>
                <span className="text-xs text-zinc-400 whitespace-nowrap shrink-0">
                  {formatDate(entry.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{entry.parsedItems.length} items parsed</span>
              </div>

              <ul className="flex flex-col gap-1 border-t pt-3">
                {entry.parsedItems.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-600">
                      {item.quantity} {item.name}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {item.caloriesMin}–{item.caloriesMax} kcal
                      {item.protein != null && ` · ${item.protein}g`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
