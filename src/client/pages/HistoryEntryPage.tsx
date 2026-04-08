"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";
import { createItemsEntry } from "@/client/features/entries/api";
import { addIntakeEntry } from "@/client/features/entries/intakeEntries";
import { addIntakeItems, loadIntakeItems } from "@/client/features/entries/intakeItems";
import { useToast } from "@/client/infra/toast";
import { EntryCard } from "@/client/components/EntryCard";
import { ItemInput } from "@/client/components/ItemInput";

function HistoryRow({
  item,
  selected,
  onToggle,
}: {
  item: IntakeItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <li
      onClick={() => onToggle(item.id)}
      className="flex items-center gap-3 py-3 border-b border-zinc-800/40 cursor-pointer select-none last:border-0"
    >
      <div
        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
          selected ? "bg-zinc-100 border-zinc-100" : "border-zinc-600"
        }`}
      >
        {selected && (
          <svg className="w-3 h-3 text-zinc-900" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200">{item.name}</p>
        <p className="text-xs text-zinc-500">
          {item.quantity} · {item.caloriesMin}–{item.caloriesMax} kcal
          {item.protein != null && ` · ${item.protein}g prot`}
        </p>
      </div>
    </li>
  );
}

function HistoryList({
  items,
  selectedIds,
  onToggle,
}: {
  items: IntakeItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent = items.filter((i) => i.consumedAt >= sevenDaysAgo);
  const older = items.filter((i) => i.consumedAt < sevenDaysAgo);
  const hasBoth = recent.length > 0 && older.length > 0;

  return (
    <div className="flex flex-col">
      {recent.length > 0 && (
        <>
          {hasBoth && (
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-1">
              Últimos 7 dias
            </p>
          )}
          <ul className="flex flex-col">
            {recent.map((item) => (
              <HistoryRow key={item.id} item={item} selected={selectedIds.has(item.id)} onToggle={onToggle} />
            ))}
          </ul>
        </>
      )}
      {older.length > 0 && (
        <>
          <p className={`text-xs font-medium text-zinc-600 uppercase tracking-widest mb-1 ${hasBoth ? "mt-5" : ""}`}>
            Mais antigos
          </p>
          <ul className="flex flex-col">
            {older.map((item) => (
              <HistoryRow key={item.id} item={item} selected={selectedIds.has(item.id)} onToggle={onToggle} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

type StagedItem = {
  name: string;
  qty: string;
  sourceQty: string | null; // null = new item added via ItemInput
  sourceItem: IntakeItem | null; // null = new item
};

type Phase = "select" | "stage" | "confirm" | "preview";

function getHistoryItems(items: IntakeItem[]): IntakeItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function HistoryEntryPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>("select");
  const [historyItems, setHistoryItems] = useState<IntakeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [directItems, setDirectItems] = useState<IntakeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ entry: IntakeEntry; items: IntakeItem[] } | null>(null);

  useEffect(() => {
    const existing = loadIntakeItems();
    setHistoryItems(getHistoryItems(existing));
    setSuggestions([...new Set(existing.map((i) => i.name))]);
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleContinue() {
    const selected = historyItems.filter((item) => selectedIds.has(item.id));
    setStagedItems(
      selected.map((item) => ({
        name: item.name,
        qty: item.quantity,
        sourceQty: item.quantity,
        sourceItem: item,
      }))
    );
    setPhase("stage");
  }

  function handleAdd(name: string, qty: string) {
    setStagedItems((prev) => [...prev, { name, qty, sourceQty: null, sourceItem: null }]);
  }

  function handleUpdateQty(index: number, qty: string) {
    setStagedItems((prev) => prev.map((item, i) => (i === index ? { ...item, qty } : item)));
  }

  function handleRemove(index: number) {
    setStagedItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stagedItems.length === 0) return;

    const hasChanges = stagedItems.some(
      (item) => item.sourceQty === null || item.qty !== item.sourceQty
    );

    if (!hasChanges) {
      const now = new Date().toISOString();
      const newItems: IntakeItem[] = stagedItems.map((item) => ({
        ...item.sourceItem!,
        id: crypto.randomUUID(),
        quantity: item.qty,
        consumedAt: now,
        createdAt: now,
        updatedAt: now,
        source: "manual" as const,
        editedByUser: false,
        processingId: undefined,
      }));
      setDirectItems(newItems);
      setPhase("confirm");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rawInput = stagedItems
        .map((i) => (i.qty ? `${i.qty} ${i.name}` : i.name))
        .join("\n");
      const { intakeEntry, intakeItems } = await createItemsEntry(rawInput);
      setPreview({ entry: intakeEntry, items: intakeItems });
      setPhase("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!preview) return;
    addIntakeEntry(preview.entry);
    addIntakeItems(preview.items);
    showToast("Entrada salva.");
    router.push("/");
  }

  function handleDiscard() {
    setPreview(null);
    setPhase("stage");
  }

  function handleSaveDirect() {
    addIntakeItems(directItems);
    showToast("Entrada salva.");
    router.push("/");
  }

  if (phase === "confirm") {
    const totalCalMin = directItems.reduce((s, i) => s + i.caloriesMin, 0);
    const totalCalMax = directItems.reduce((s, i) => s + i.caloriesMax, 0);
    const totalProtein = directItems.every((i) => i.protein == null)
      ? null
      : directItems.reduce((s, i) => s + (i.protein ?? 0), 0);

    return (
      <main className="w-full max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Revisar entrada</h1>
        <div className="bg-zinc-900 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-baseline justify-between border-b border-zinc-800/50 pb-3">
            <span className="font-semibold text-lg text-zinc-50">
              {totalCalMin}–{totalCalMax} kcal
            </span>
            {totalProtein != null && (
              <span className="text-sm text-zinc-500">{totalProtein}g proteína</span>
            )}
          </div>
          <ul className="flex flex-col gap-1">
            {directItems.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
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
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSaveDirect}
            className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-4 py-2 text-sm font-medium flex-1 transition-colors"
          >
            Aceitar
          </button>
          <button
            onClick={() => setPhase("stage")}
            className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded-lg px-4 py-2 text-sm flex-1 transition-colors"
          >
            Descartar
          </button>
        </div>
      </main>
    );
  }

  if (phase === "preview" && preview) {
    return (
      <main className="w-full max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Revisar entrada</h1>
        <EntryCard entry={preview.entry} items={preview.items} />
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAccept}
            className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-4 py-2 text-sm font-medium flex-1 transition-colors"
          >
            Aceitar
          </button>
          <button
            onClick={handleDiscard}
            className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded-lg px-4 py-2 text-sm flex-1 transition-colors"
          >
            Descartar
          </button>
        </div>
      </main>
    );
  }

  if (phase === "stage") {
    return (
      <main className="w-full max-w-xl mx-auto p-8">
        <button
          onClick={() => setPhase("select")}
          className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6 inline-block"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold mb-6">Confirmar itens</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          <ItemInput onAdd={handleAdd} suggestions={suggestions} disabled={loading} />
          {stagedItems.length > 0 && (
            <ul className="flex flex-col gap-1 mt-1">
              {stagedItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-zinc-200">{item.name}</span>
                    {item.sourceItem && (
                      <span className="text-xs text-zinc-600">
                        {item.sourceItem.caloriesMin}–{item.sourceItem.caloriesMax} kcal
                        {item.sourceItem.protein != null && ` · ${item.sourceItem.protein}g prot`}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.qty}
                    onChange={(e) => handleUpdateQty(i, e.target.value)}
                    placeholder="qtd"
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-16 text-xs text-center text-zinc-300 focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    aria-label="Remover item"
                    className="text-zinc-600 hover:text-red-400 transition-colors text-base leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="submit"
            disabled={loading || stagedItems.length === 0}
            className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 rounded-lg px-4 py-2 text-sm disabled:opacity-30 transition-colors mt-1"
          >
            {loading ? "Analisando..." : "Analisar"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </main>
    );
  }

  return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      <Link
        href="/new"
        className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6 inline-block"
      >
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-6">Do histórico</h1>

      {historyItems.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum alimento registrado ainda.</p>
      ) : (
        <HistoryList items={historyItems} selectedIds={selectedIds} onToggle={toggleSelect} />
      )}

      {historyItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800/60">
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleContinue}
              disabled={selectedIds.size === 0}
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-30 transition-colors"
            >
              {selectedIds.size > 0 ? `Continuar (${selectedIds.size})` : "Selecione itens"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
