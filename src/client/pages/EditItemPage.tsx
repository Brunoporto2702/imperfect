"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IntakeItem } from "@/server/food/core/models/food";
import { loadIntakeItems, updateIntakeItem } from "@/client/features/entries/intakeItems";

function toDateTimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

export function EditItemPage({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<IntakeItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    caloriesMin: "",
    caloriesMax: "",
    protein: "",
    consumedAt: "",
  });

  useEffect(() => {
    const found = loadIntakeItems().find((i) => i.id === id) ?? null;
    if (!found) { router.replace("/items"); return; }
    setItem(found);
    setForm({
      name: found.name,
      quantity: found.quantity,
      caloriesMin: String(found.caloriesMin),
      caloriesMax: String(found.caloriesMax),
      protein: found.protein != null ? String(found.protein) : "",
      consumedAt: toDateTimeLocal(found.consumedAt),
    });
  }, [id, router]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    const now = new Date().toISOString();
    const updated: IntakeItem = {
      ...item,
      name: form.name.trim(),
      quantity: form.quantity.trim(),
      caloriesMin: Number(form.caloriesMin),
      caloriesMax: Number(form.caloriesMax),
      protein: form.protein.trim() !== "" ? Number(form.protein) : undefined,
      consumedAt: new Date(form.consumedAt).toISOString(),
      editedByUser: true,
      updatedAt: now,
    };

    updateIntakeItem(updated);
    router.push("/items");
  }

  if (!item) return null;

  return (
    <main className="w-full max-w-xl mx-auto p-8">
      <Link href="/items" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-6">Editar alimento</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Nome</label>
          <input
            className="bg-zinc-900 border border-zinc-800 text-zinc-50 focus:border-zinc-600 focus:outline-none rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Quantidade</label>
          <input
            className="bg-zinc-900 border border-zinc-800 text-zinc-50 focus:border-zinc-600 focus:outline-none rounded-lg px-3 py-2 text-sm"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Faixa de calorias (kcal)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="mín"
              className="bg-zinc-900 border border-zinc-800 text-zinc-50 focus:border-zinc-600 focus:outline-none rounded-lg px-3 py-2 text-sm flex-1"
              value={form.caloriesMin}
              onChange={(e) => setForm((f) => ({ ...f, caloriesMin: e.target.value }))}
              required
            />
            <span className="text-zinc-600 text-sm">—</span>
            <input
              type="number"
              min={0}
              placeholder="máx"
              className="bg-zinc-900 border border-zinc-800 text-zinc-50 focus:border-zinc-600 focus:outline-none rounded-lg px-3 py-2 text-sm flex-1"
              value={form.caloriesMax}
              onChange={(e) => setForm((f) => ({ ...f, caloriesMax: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Proteína (g) — opcional</label>
          <input
            type="number"
            min={0}
            className="bg-zinc-900 border border-zinc-800 text-zinc-50 focus:border-zinc-600 focus:outline-none rounded-lg px-3 py-2 text-sm"
            value={form.protein}
            onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Consumido em</label>
          <input
            type="datetime-local"
            className="bg-zinc-900 border border-zinc-800 text-zinc-50 focus:border-zinc-600 focus:outline-none rounded-lg px-3 py-2 text-sm"
            value={form.consumedAt}
            onChange={(e) => setForm((f) => ({ ...f, consumedAt: e.target.value }))}
            required
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-4 py-2 text-sm font-medium flex-1 transition-colors"
          >
            Salvar
          </button>
          <Link
            href="/items"
            className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded-lg px-4 py-2 text-sm flex-1 text-center transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
