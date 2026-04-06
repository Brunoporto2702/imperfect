"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IntakeItem } from "@/server/food/core/models/food";
import { loadIntakeItems, deleteIntakeItem } from "@/client/features/entries/intakeItems";
import { getDaySummaries } from "@/client/logic/entries";

export function ItemsPage() {
  const [items, setItems] = useState<IntakeItem[]>([]);

  useEffect(() => {
    setItems(loadIntakeItems());
  }, []);

  function handleDelete(id: string) {
    if (!confirm("Excluir este alimento?")) return;
    deleteIntakeItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const daySummaries = getDaySummaries(items);

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-6">Alimentos</h1>

      {daySummaries.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhum alimento registrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {daySummaries.map((day) => (
            <div key={day.dateKey}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold">{day.label}</span>
                <span className="text-xs text-zinc-400">{day.calMin}–{day.calMax} kcal</span>
              </div>
              <ul className="flex flex-col divide-y">
                {day.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2.5 gap-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm truncate">
                        {item.quantity} {item.name}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {item.caloriesMin}–{item.caloriesMax} kcal
                        {item.protein != null && ` · ${item.protein}g proteína`}
                        {item.editedByUser && (
                          <span className="ml-1.5 text-zinc-300">· editado</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/items/${item.id}`}
                        className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors text-base leading-none"
                        aria-label="Excluir item"
                      >
                        ×
                      </button>
                    </div>
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
