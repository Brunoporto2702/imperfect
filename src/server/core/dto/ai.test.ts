import { describe, it, expect } from "vitest";
import { AiResponseDtoSchema } from "./ai";

describe("AiResponseDtoSchema", () => {
  it("accepts a valid response", () => {
    const result = AiResponseDtoSchema.safeParse({
      items: [{ name: "egg", quantity: "1", caloriesMin: 70, caloriesMax: 90 }],
      confidence: "high",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid confidence values", () => {
    for (const confidence of ["low", "medium", "high"]) {
      expect(AiResponseDtoSchema.safeParse({ items: [], confidence }).success).toBe(true);
    }
  });

  it("rejects an invalid confidence value", () => {
    expect(AiResponseDtoSchema.safeParse({ items: [], confidence: "very high" }).success).toBe(false);
  });

  it("rejects when items is missing", () => {
    expect(AiResponseDtoSchema.safeParse({ confidence: "high" }).success).toBe(false);
  });

  it("rejects negative calories on an item", () => {
    const result = AiResponseDtoSchema.safeParse({
      items: [{ name: "egg", quantity: "1", caloriesMin: -10, caloriesMax: 90 }],
      confidence: "high",
    });
    expect(result.success).toBe(false);
  });
});
