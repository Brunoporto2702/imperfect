import { describe, it, expect } from "vitest";
import { computeTotals } from "./food";
import type { FoodEntry } from "../models/food";

const baseEntry: Omit<FoodEntry, "totalCaloriesMin" | "totalCaloriesMax" | "totalProtein"> = {
  id: "test-id",
  createdAt: new Date("2024-01-01"),
  rawInput: "two eggs",
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
  confidence: "high",
};

describe("computeTotals", () => {
  it("sums calorie ranges across all items", () => {
    const entry = {
      ...baseEntry,
      items: [
        { name: "egg", quantity: "1", caloriesMin: 70, caloriesMax: 90, protein: 6 },
        { name: "toast", quantity: "1 slice", caloriesMin: 80, caloriesMax: 100, protein: 3 },
      ],
    };
    const result = computeTotals(entry);
    expect(result.totalCaloriesMin).toBe(150);
    expect(result.totalCaloriesMax).toBe(190);
  });

  it("sums protein when all items have it", () => {
    const result = computeTotals(baseEntry);
    expect(result.totalProtein).toBe(12);
  });

  it("sums protein treating items without protein as 0", () => {
    const entry = {
      ...baseEntry,
      items: [
        { name: "egg", quantity: "1", caloriesMin: 70, caloriesMax: 90, protein: 6 },
        { name: "toast", quantity: "1 slice", caloriesMin: 80, caloriesMax: 100 },
      ],
    };
    const result = computeTotals(entry);
    expect(result.totalProtein).toBe(6);
  });

  it("returns undefined totalProtein when no items have protein", () => {
    const entry = {
      ...baseEntry,
      items: [{ name: "rice", quantity: "1 cup", caloriesMin: 200, caloriesMax: 250 }],
    };
    expect(computeTotals(entry).totalProtein).toBeUndefined();
  });

  it("handles an empty items array", () => {
    const result = computeTotals({ ...baseEntry, items: [] });
    expect(result.totalCaloriesMin).toBe(0);
    expect(result.totalCaloriesMax).toBe(0);
    expect(result.totalProtein).toBeUndefined();
  });
});
