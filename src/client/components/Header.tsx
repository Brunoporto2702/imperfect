"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { checkClientVersion } from "@/client/infra/version";

const NAV = [
  { label: "Alimentos", href: "/items" },
  { label: "Log", href: "/log" },
];

export function Header() {
  const pathname = usePathname();

  useEffect(() => {
    checkClientVersion();
  }, []);

  return (
    <header className="w-full border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="w-full max-w-xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-base tracking-tight text-zinc-50">
          Imperfect
        </Link>
        <nav className="flex items-center gap-6">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname.startsWith(href)
                  ? "text-zinc-50 font-medium"
                  : "text-zinc-500 hover:text-zinc-200"
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
