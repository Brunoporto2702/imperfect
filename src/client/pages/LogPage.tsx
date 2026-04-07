"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IntakeEntry } from "@/server/food/core/models/food";
import { loadIntakeEntries } from "@/client/features/entries/intakeEntries";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}


export function LogPage() {
  const [entries, setEntries] = useState<IntakeEntry[]>([]);

  useEffect(() => {
    setEntries(loadIntakeEntries());
  }, []);

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-6">Log</h1>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma entrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-zinc-900 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-zinc-100 leading-snug">{entry.inputText}</p>
                <span className="text-xs text-zinc-600 whitespace-nowrap shrink-0">
                  {formatDate(entry.createdAt)}
                </span>
              </div>

              <span className="text-xs text-zinc-600">{entry.parsedItems.length} itens identificados</span>

              <ul className="flex flex-col gap-1 border-t border-zinc-800/50 pt-3">
                {entry.parsedItems.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-400">
                      {item.quantity} {item.name}
                    </span>
                    <span className="text-xs text-zinc-600">
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
