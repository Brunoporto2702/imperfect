"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IntakeEntry, IntakeItem } from "@/server/core/models/food";
import { createEntry } from "@/client/features/entries/api";
import { addIntakeEntry } from "@/client/features/entries/intakeEntries";
import { addIntakeItems } from "@/client/features/entries/intakeItems";
import { EntryCard } from "@/client/components/EntryCard";

export function NewEntryPage() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ entry: IntakeEntry; items: IntakeItem[] } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { intakeEntry, intakeItems } = await createEntry(rawInput);
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
    router.push("/?saved=1");
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
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6 inline-block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">New entry</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
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
