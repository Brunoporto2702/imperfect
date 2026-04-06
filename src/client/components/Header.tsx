"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Alimentos", href: "/items" },
  { label: "Log", href: "/log" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b">
      <div className="w-full max-w-xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-sm tracking-tight">
          Imperfect
        </Link>
        <nav className="flex items-center gap-6">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname.startsWith(href)
                  ? "text-black font-medium"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
