import { FoodEntry } from "../models/food";

export function computeTotals(
  entry: Omit<FoodEntry, "totalCaloriesMin" | "totalCaloriesMax" | "totalProtein">
): FoodEntry {
  return {
    ...entry,
    totalCaloriesMin: entry.items.reduce((sum, item) => sum + item.caloriesMin, 0),
    totalCaloriesMax: entry.items.reduce((sum, item) => sum + item.caloriesMax, 0),
    totalProtein: entry.items.every((item) => item.protein == null)
      ? undefined
      : entry.items.reduce((sum, item) => sum + (item.protein ?? 0), 0),
  };
}
