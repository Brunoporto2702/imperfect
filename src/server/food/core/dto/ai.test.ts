import { describe, it, expect } from "vitest";
import { AiResponseDtoSchema } from "./ai";

describe("AiResponseDtoSchema", () => {
  it("accepts a valid response", () => {
    const result = AiResponseDtoSchema.safeParse({
      items: [{ name: "egg", quantity: "1", caloriesMin: 70, caloriesMax: 90 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty items array", () => {
    expect(AiResponseDtoSchema.safeParse({ items: [] }).success).toBe(true);
  });

  it("rejects when items is missing", () => {
    expect(AiResponseDtoSchema.safeParse({}).success).toBe(false);
  });

  it("rejects negative calories on an item", () => {
    const result = AiResponseDtoSchema.safeParse({
      items: [{ name: "egg", quantity: "1", caloriesMin: -10, caloriesMax: 90 }],
    });
    expect(result.success).toBe(false);
  });
});
