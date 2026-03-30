import type { FoodEntry } from "@/server/core/models/food";

export function EntryCard({ entry }: { entry: FoodEntry }) {
  return (
    <div className="border rounded p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
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

      <ul className="flex flex-col gap-1 border-t pt-3">
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
