"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";
import { createImageEntry } from "@/client/features/entries/api";
import { addIntakeEntry } from "@/client/features/entries/intakeEntries";
import { addIntakeItems } from "@/client/features/entries/intakeItems";
import { useToast } from "@/client/infra/toast";
import { EntryCard } from "@/client/components/EntryCard";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
}

export function NewImageEntryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ entry: IntakeEntry; items: IntakeItem[] } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImageDataUrl(compressed);
  }

  function handleClearImage() {
    setImageDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageDataUrl) return;
    setLoading(true);
    setError(null);

    try {
      const { intakeEntry, intakeItems } = await createImageEntry(
        imageDataUrl,
        description.trim() || undefined
      );
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

  return (
    <main className="w-full max-w-xl mx-auto p-8">
      <Link href="/new" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-6">Foto</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        {imageDataUrl ? (
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Foto da refeição"
              className="w-full rounded-xl object-cover max-h-64"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-2 right-2 bg-zinc-900/80 text-zinc-200 rounded-full w-7 h-7 flex items-center justify-center text-base leading-none"
              aria-label="Remover imagem"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl px-4 py-10 text-sm text-zinc-500 hover:text-zinc-300 transition-colors text-center"
          >
            Toque para adicionar uma foto
          </button>
        )}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={2}
          className="bg-zinc-900 border border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none rounded-lg px-3 py-2 text-sm resize-none"
        />
        <button
          type="submit"
          disabled={loading || !imageDataUrl}
          className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 rounded-lg px-4 py-2 text-sm disabled:opacity-30 transition-colors mt-1"
        >
          {loading ? "Analisando..." : "Analisar"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <div className="mt-6 text-center">
        <Link href="/new" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          tentar outra forma →
        </Link>
      </div>
    </main>
  );
}
