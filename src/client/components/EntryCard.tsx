import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";

function formatDate(value: string): string {
  const d = new Date(value);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
}

export function EntryCard({
  entry,
  items,
  onDelete,
}: {
  entry: IntakeEntry;
  items: IntakeItem[];
  onDelete?: (processingId: string) => void;
}) {
  const totalCalMin = items.reduce((s, i) => s + i.caloriesMin, 0);
  const totalCalMax = items.reduce((s, i) => s + i.caloriesMax, 0);
  const totalProtein = items.every((i) => i.protein == null)
    ? null
    : items.reduce((s, i) => s + (i.protein ?? 0), 0);

  function handleDelete() {
    if (confirm("Excluir esta entrada?")) {
      onDelete?.(entry.id);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">
          {entry.inputText}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-600 whitespace-nowrap">
            {formatDate(entry.createdAt)}
          </span>
          {onDelete && (
            <button
              onClick={handleDelete}
              aria-label="Excluir entrada"
              className="text-zinc-600 hover:text-red-400 transition-colors text-base leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between border-t border-zinc-800/50 pt-3">
        <span className="font-semibold text-lg text-zinc-50">
          {totalCalMin}–{totalCalMax} kcal
        </span>
        {totalProtein != null && (
          <span className="text-sm text-zinc-500">{totalProtein}g proteína</span>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span className="text-zinc-400">
              {item.quantity} {item.name}
            </span>
            <span className="text-xs text-zinc-600">
              {item.caloriesMin}–{item.caloriesMax} kcal
              {item.protein != null && ` · ${item.protein}g`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
