import Link from "next/link";
import type { ReactNode } from "react";

const INPUT_TYPES: { href: string; title: string; badge?: string; description: string; icon: ReactNode }[] = [
  {
    href: "/new/image",
    title: "Foto",
    badge: "recomendado",
    description: "Tire uma foto ou envie uma imagem da refeição.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h.75l.94-1.5h5.62L12.75 4h2.75A2.5 2.5 0 0 1 18 6.5v8A2.5 2.5 0 0 1 15.5 17h-11A2.5 2.5 0 0 1 2 14.5v-8Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <circle cx="10" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    href: "/new/history",
    title: "Do histórico",
    description: "Selecione itens que você já registrou antes.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M10 6.5V10l2.5 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/new/text",
    title: "Texto livre",
    description: "Descreva sua refeição do jeito que quiser.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 5h12M4 8.5h12M4 12h8M4 15.5h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/new/items",
    title: "Por itens",
    description: "Adicione cada alimento com nome e quantidade.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="5" cy="6" r="1.25" fill="currentColor"/>
        <circle cx="5" cy="10" r="1.25" fill="currentColor"/>
        <circle cx="5" cy="14" r="1.25" fill="currentColor"/>
        <path d="M8.5 6h7M8.5 10h7M8.5 14h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Page() {
  return (
    <main className="w-full max-w-xl mx-auto p-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-8 text-zinc-50">Nova entrada</h1>
      <div className="flex flex-col gap-3">
        {INPUT_TYPES.map(({ href, title, description, badge, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-zinc-900 hover:bg-zinc-800 rounded-xl px-5 py-4 transition-colors flex items-center gap-4"
          >
            <span className="text-zinc-400 shrink-0">{icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-zinc-50">{title}</p>
                {badge && (
                  <span className="text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5 leading-none">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
            </div>
            <span className="text-zinc-600 text-sm shrink-0">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
