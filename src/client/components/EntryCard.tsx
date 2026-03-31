import type { FoodEntry } from "@/server/core/models/food";

function formatDate(value: Date | string): string {
  const d = new Date(value);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function EntryCard({
  entry,
  onDelete,
}: {
  entry: FoodEntry;
  onDelete?: (id: string) => void;
}) {
  function handleDelete() {
    if (confirm("Delete this entry?")) {
      onDelete?.(entry.id);
    }
  }

  return (
    <div className="border rounded p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {entry.rawInput}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            {formatDate(entry.createdAt)}
          </span>
          {onDelete && (
            <button
              onClick={handleDelete}
              aria-label="Delete entry"
              className="text-zinc-300 hover:text-red-500 transition-colors text-base leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between border-t pt-3">
        <span className="font-semibold text-lg">
          {entry.totalCaloriesMin}–{entry.totalCaloriesMax} kcal
        </span>
        <div className="flex gap-3 text-sm text-zinc-500">
          {entry.totalProtein != null && (
            <span>{entry.totalProtein}g protein</span>
          )}
          <span className="capitalize">{entry.confidence} confidence</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {entry.items.map((item, i) => (
          <li key={i} className="flex justify-between text-sm">
            <span>
              {item.quantity} {item.name}
            </span>
            <span className="text-zinc-500">
              {item.caloriesMin}–{item.caloriesMax} kcal
              {item.protein != null && ` · ${item.protein}g`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
