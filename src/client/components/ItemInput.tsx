"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onAdd: (name: string, qty: string) => void;
  suggestions: string[];
  disabled?: boolean;
};

const QTY_RE = /^(\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|dl|oz|lb|cups?|tbsp|tsp|x)?\s+)/i;

function splitQty(text: string): { name: string; qty: string } {
  const match = text.match(QTY_RE);
  if (match) {
    return { qty: match[1].trim(), name: text.slice(match[1].length).trim() };
  }
  return { name: text.trim(), qty: "" };
}

export function ItemInput({ onAdd, suggestions, disabled }: Props) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const filtered = (() => {
    const trimmed = name.trim();
    if (!trimmed) return [];
    try {
      const re = new RegExp(trimmed, "i");
      return suggestions.filter((s) => re.test(s)).slice(0, 6);
    } catch {
      return suggestions.filter((s) => s.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 6);
    }
  })();

  const showDropdown = open && filtered.length > 0;

  function applyAutoSplit() {
    const split = splitQty(name);
    if (split.qty) {
      setName(split.name);
      setQty((prev) => prev || split.qty);
    }
  }

  function commit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onAdd(trimmedName, qty.trim());
    setName("");
    setQty("");
    setOpen(false);
    setHighlighted(-1);
  }

  function selectSuggestion(s: string) {
    const split = splitQty(s);
    setName(split.name);
    if (split.qty) setQty((prev) => prev || split.qty);
    setOpen(false);
    setHighlighted(-1);
    qtyRef.current?.focus();
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && filtered[highlighted]) {
        selectSuggestion(filtered[highlighted]);
      } else {
        applyAutoSplit();
        qtyRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  }

  function handleQtyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          className="border rounded p-3 w-full text-sm"
          placeholder="Item name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onBlur={applyAutoSplit}
          onFocus={() => setOpen(true)}
          onKeyDown={handleNameKeyDown}
          disabled={disabled}
          autoComplete="off"
        />
        {showDropdown && (
          <ul className="absolute z-10 left-0 right-0 top-full mt-1 border rounded bg-white shadow-sm text-sm overflow-hidden">
            {filtered.map((s, i) => (
              <li
                key={s}
                className={`px-3 py-2 cursor-pointer text-zinc-800 ${
                  i === highlighted ? "bg-zinc-100" : "hover:bg-zinc-50"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        ref={qtyRef}
        type="text"
        className="border rounded p-3 w-20 text-sm text-center"
        placeholder="qty"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onKeyDown={handleQtyKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={commit}
        disabled={disabled || !name.trim()}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40 shrink-0"
      >
        Add
      </button>
    </div>
  );
}
