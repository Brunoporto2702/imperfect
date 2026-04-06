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

export function NewEntryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [stagedItems, setStagedItems] = useState<{ name: string; qty: string }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ entry: IntakeEntry; items: IntakeItem[] } | null>(null);

  useEffect(() => {
    const existing = loadIntakeItems();
    const unique = [...new Set(existing.map((i) => i.name))];
    setSuggestions(unique);
  }, []);

  function handleAdd(name: string, qty: string) {
    setStagedItems((prev) => [...prev, { name, qty }]);
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
    setLoading(true);
    setError(null);

    try {
      const rawInput = stagedItems
        .map((i) => (i.qty ? `${i.qty} ${i.name}` : i.name))
        .join("\n");
      const { intakeEntry, intakeItems } = await createItemsEntry(rawInput);
      setPreview({ entry: intakeEntry, items: intakeItems });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!preview) return;
    addIntakeEntry(preview.entry);
    addIntakeItems(preview.items);
    showToast("Entry saved.");
    router.push("/");
  }

  function handleDiscard() {
    setPreview(null);
  }

  if (preview) {
    return (
      <main className="w-full max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Review entry</h1>
        <EntryCard entry={preview.entry} items={preview.items} />
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAccept}
            className="bg-black text-white rounded px-4 py-2 text-sm flex-1"
          >
            Accept
          </button>
          <button
            onClick={handleDiscard}
            className="border rounded px-4 py-2 text-sm flex-1"
          >
            Discard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-xl mx-auto p-8">
      <Link href="/new" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6 inline-block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">By items</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        <ItemInput onAdd={handleAdd} suggestions={suggestions} disabled={loading} />
        {stagedItems.length > 0 && (
          <ul className="flex flex-col gap-1 mt-1">
            {stagedItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 border rounded px-3 py-2 text-sm">
                <span className="flex-1">{item.name}</span>
                <input
                  type="text"
                  value={item.qty}
                  onChange={(e) => handleUpdateQty(i, e.target.value)}
                  placeholder="qty"
                  className="border rounded px-2 py-1 w-16 text-xs text-center text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  aria-label="Remove item"
                  className="text-zinc-300 hover:text-red-500 transition-colors text-base leading-none"
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
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40 mt-1"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
