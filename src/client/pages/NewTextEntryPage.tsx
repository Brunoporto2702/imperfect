"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";
import { createTextEntry } from "@/client/features/entries/api";
import { addIntakeEntry } from "@/client/features/entries/intakeEntries";
import { addIntakeItems } from "@/client/features/entries/intakeItems";
import { useToast } from "@/client/infra/toast";
import { EntryCard } from "@/client/components/EntryCard";

export function NewTextEntryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ entry: IntakeEntry; items: IntakeItem[] } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { intakeEntry, intakeItems } = await createTextEntry(rawInput.trim());
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
    showToast("Entrada salva.");
    router.push("/");
  }

  function handleDiscard() {
    setPreview(null);
  }

  if (preview) {
    return (
      <main className="w-full max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Revisar entrada</h1>
        <EntryCard entry={preview.entry} items={preview.items} />
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAccept}
            className="bg-black text-white rounded px-4 py-2 text-sm flex-1"
          >
            Aceitar
          </button>
          <button
            onClick={handleDiscard}
            className="border rounded px-4 py-2 text-sm flex-1"
          >
            Descartar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-xl mx-auto p-8">
      <Link href="/new" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-6">Free text</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Descreva sua refeição... ex: Almoço com frango grelhado, arroz e salada"
          rows={5}
          className="border rounded px-3 py-2 text-sm resize-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !rawInput.trim()}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40"
        >
          {loading ? "Analisando..." : "Analisar"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
