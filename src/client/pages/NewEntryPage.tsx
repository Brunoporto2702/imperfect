"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FoodEntry } from "@/server/core/models/food";
import { createEntry } from "@/client/features/entries/api";
import { loadHistory, saveHistory } from "@/client/features/entries/history";
import { EntryCard } from "@/client/components/EntryCard";

export function NewEntryPage() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FoodEntry | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const entry = await createEntry(rawInput);
      setPreview(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!preview) return;
    saveHistory([preview, ...loadHistory()]);
    router.push("/?saved=1");
  }

  function handleDiscard() {
    setPreview(null);
  }

  if (preview) {
    return (
      <main className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Review entry</h1>
        <EntryCard entry={preview} />
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
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">New entry</h1>
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
    </main>
  );
}
