"use client";

import { useState } from "react";
import type { FoodEntry } from "@/lib/schema";

export default function Home() {
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEntry(null);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      setEntry(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Imperfect</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          className="border rounded p-3 w-full min-h-[100px] resize-y text-sm"
          placeholder='What did you eat? e.g. "two scrambled eggs and a slice of toast"'
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !rawInput.trim()}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {entry && (
        <div className="mt-6 border rounded p-4 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold text-lg">
              {entry.totalCaloriesMin}–{entry.totalCaloriesMax} kcal
            </span>
            <div className="flex gap-3 text-sm text-zinc-500">
              {entry.totalProtein != null && (
                <span>{entry.totalProtein}g protein</span>
              )}
              <span className="capitalize">{entry.confidence} confidence</span>
            </div>
          </div>

          <ul className="flex flex-col gap-1 border-t pt-3">
            {entry.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>
                  {item.quantity} {item.name}
                </span>
                <span className="text-zinc-500">
                  {item.caloriesMin}–{item.caloriesMax} kcal
                  {item.protein != null && ` · ${item.protein}g`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
