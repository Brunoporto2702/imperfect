"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onAdd: (text: string) => void;
  suggestions: string[];
  disabled?: boolean;
};

export function ItemInput({ onAdd, suggestions, disabled }: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = (() => {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const re = new RegExp(trimmed, "i");
      return suggestions.filter((s) => re.test(s)).slice(0, 6);
    } catch {
      return suggestions.filter((s) => s.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 6);
    }
  })();

  const showDropdown = open && filtered.length > 0;

  function commit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    setOpen(false);
    setHighlighted(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && filtered[highlighted]) {
        commit(filtered[highlighted]);
      } else {
        commit(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
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
          placeholder='e.g. "2 scrambled eggs"'
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
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
                  commit(s);
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={() => commit(value)}
        disabled={disabled || !value.trim()}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40 shrink-0"
      >
        Add
      </button>
    </div>
  );
}
