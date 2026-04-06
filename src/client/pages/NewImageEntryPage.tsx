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
      <h1 className="text-2xl font-bold mb-6">New entry — photo</h1>
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
              alt="Selected meal"
              className="w-full rounded object-cover max-h-64"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-base leading-none"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 rounded px-4 py-8 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 transition-colors text-center"
          >
            Tap to attach a photo
          </button>
        )}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="border rounded px-3 py-2 text-sm resize-none"
        />
        <button
          type="submit"
          disabled={loading || !imageDataUrl}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40 mt-1"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
