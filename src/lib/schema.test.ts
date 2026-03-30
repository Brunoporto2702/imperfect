import { describe, it, expect } from "vitest";
import {
  FoodItemSchema,
  FoodEntrySchema,
  AiResponseSchema,
  CreateEntryRequestSchema,
} from "./schema";

describe("FoodItemSchema", () => {
  it("accepts a valid item with all fields", () => {
    const result = FoodItemSchema.safeParse({
      name: "scrambled eggs",
      quantity: "2 eggs",
      caloriesMin: 140,
      caloriesMax: 200,
      protein: 12,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid item without protein", () => {
    const result = FoodItemSchema.safeParse({
      name: "rice",
      quantity: "1 cup",
      caloriesMin: 200,
      caloriesMax: 250,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.protein).toBeUndefined();
  });

  it("rejects when caloriesMin is a string", () => {
    const result = FoodItemSchema.safeParse({
      name: "rice",
      quantity: "1 cup",
      caloriesMin: "200",
      caloriesMax: 250,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when name is missing", () => {
    const result = FoodItemSchema.safeParse({
      quantity: "1 cup",
      caloriesMin: 200,
      caloriesMax: 250,
    });
    expect(result.success).toBe(false);
  });
});

describe("AiResponseSchema", () => {
  it("accepts a valid response", () => {
    const result = AiResponseSchema.safeParse({
      items: [{ name: "egg", quantity: "1", caloriesMin: 70, caloriesMax: 90 }],
      confidence: "high",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid confidence values", () => {
    for (const confidence of ["low", "medium", "high"]) {
      const result = AiResponseSchema.safeParse({ items: [], confidence });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an invalid confidence value", () => {
    const result = AiResponseSchema.safeParse({ items: [], confidence: "very high" });
    expect(result.success).toBe(false);
  });

  it("rejects when items is missing", () => {
    const result = AiResponseSchema.safeParse({ confidence: "high" });
    expect(result.success).toBe(false);
  });
});

describe("FoodEntrySchema", () => {
  const valid = {
    id: "abc-123",
    createdAt: "2024-01-01T00:00:00.000Z",
    rawInput: "two eggs",
    items: [],
    totalCaloriesMin: 0,
    totalCaloriesMax: 0,
    confidence: "high",
  };

  it("coerces createdAt from an ISO string to a Date", () => {
    const result = FoodEntrySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.createdAt).toBeInstanceOf(Date);
  });

  it("accepts an optional imageUrl", () => {
    const result = FoodEntrySchema.safeParse({ ...valid, imageUrl: "https://example.com/img.jpg" });
    expect(result.success).toBe(true);
  });

  it("accepts when totalProtein is absent", () => {
    const result = FoodEntrySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.totalProtein).toBeUndefined();
  });
});

describe("CreateEntryRequestSchema", () => {
  it("accepts a valid rawInput", () => {
    const result = CreateEntryRequestSchema.safeParse({ rawInput: "two eggs" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty rawInput", () => {
    const result = CreateEntryRequestSchema.safeParse({ rawInput: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when rawInput is missing", () => {
    const result = CreateEntryRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
