import Link from "next/link";

const INPUT_TYPES = [
  {
    href: "/new/items",
    title: "Por itens",
    description: "Adicione cada alimento com nome e quantidade.",
  },
  {
    href: "/new/text",
    title: "Texto livre",
    description: "Descreva sua refeição do jeito que quiser.",
  },
  {
    href: "/new/image",
    title: "Foto",
    description: "Tire uma foto ou envie uma imagem da refeição.",
  },
];

export default function Page() {
  return (
    <main className="w-full max-w-xl mx-auto p-8">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mb-8">Nova entrada</h1>
      <div className="flex flex-col gap-4">
        {INPUT_TYPES.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="border rounded-lg px-5 py-4 hover:border-zinc-400 transition-colors"
          >
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-sm text-zinc-500 mt-1">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
