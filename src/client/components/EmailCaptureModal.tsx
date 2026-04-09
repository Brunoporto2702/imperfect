"use client";

import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  onSuccess: (userId: string, isNew: boolean) => void;
  onDismiss: () => void;
  mode?: "save" | "login";
};

export function EmailCaptureModal({ onSuccess, onDismiss, mode = "save" }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Email inválido.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao criar conta.");
      const { userId, isNew } = await res.json();
      onSuccess(userId, isNew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-zinc-50 mb-1">
          {mode === "login" ? "De volta por aqui?" : "Não perde o que você construiu"}
        </h2>
        <p className="text-sm text-zinc-400 mb-5">
          {mode === "login"
            ? "É só o email — a gente traz tudo na hora."
            : "Já tem 3 registros. Com seu email a gente guarda tudo — troca de celular, limpa o app, não importa."}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-40 transition-colors"
          >
            {loading ? "Carregando..." : mode === "login" ? "Continuar" : "Guardar meus dados"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
          >
            Agora não
          </button>
        </form>
      </div>
    </div>
  );
}
