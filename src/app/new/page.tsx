import Link from "next/link";

const INPUT_TYPES = [
  {
    href: "/new/image",
    title: "Foto",
    badge: "recomendado",
    description: "Tire uma foto ou envie uma imagem da refeição.",
  },
  {
    href: "/new/text",
    title: "Texto livre",
    description: "Descreva sua refeição do jeito que quiser.",
  },
  {
    href: "/new/items",
    title: "Por itens",
    description: "Adicione cada alimento com nome e quantidade.",
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
        {INPUT_TYPES.map(({ href, title, description, badge }) => (
          <Link
            key={href}
            href={href}
            className="bg-zinc-900 hover:bg-zinc-800 rounded-xl px-5 py-4 transition-colors flex items-center justify-between gap-4"
          >
            <div>
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
