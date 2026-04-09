"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IntakeItem } from "@/server/food/core/models/food";
import { loadIntakeItems, deleteIntakeItem } from "@/client/features/entries/intakeItems";
import { loadUserId } from "@/client/features/profile/user";
import { deleteItemOnCloud } from "@/client/features/entries/sync";
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
    const userId = loadUserId();
    if (userId) {
      deleteItemOnCloud(userId, id).catch(() => {});
    }
  }

  const daySummaries = getDaySummaries(items);

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-6">Alimentos</h1>

      {daySummaries.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum alimento registrado ainda.</p>
      ) : (
        <div className="flex flex-col">
          {daySummaries.map((day, idx) => (
            <div key={day.dateKey} className={idx > 0 ? "border-t border-zinc-800/40 pt-5 mt-5" : ""}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-50">{day.label}</span>
                <span className="text-xs text-zinc-600">{day.calMin}–{day.calMax} kcal</span>
              </div>
              <ul className="flex flex-col">
                {day.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2.5 gap-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm text-zinc-300 truncate">
                        {item.quantity} {item.name}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {item.caloriesMin}–{item.caloriesMax} kcal
                        {item.protein != null && ` · ${item.protein}g proteína`}
                        {item.editedByUser && (
                          <span className="ml-1.5 text-zinc-500">· editado</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/items/${item.id}`}
                        className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors text-base leading-none"
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
