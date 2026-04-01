import { describe, it, expect } from "vitest";
import { ParsedItemSchema, IntakeEntrySchema, IntakeItemSchema } from "./food";
import { CreateEntryRequestSchema } from "./entry";

describe("ParsedItemSchema", () => {
  it("accepts a valid item with all fields", () => {
    const result = ParsedItemSchema.safeParse({
      name: "scrambled eggs",
      quantity: "2 eggs",
      caloriesMin: 140,
      caloriesMax: 200,
      protein: 12,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid item without protein", () => {
    const result = ParsedItemSchema.safeParse({
      name: "rice",
      quantity: "1 cup",
      caloriesMin: 200,
      caloriesMax: 250,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.protein).toBeUndefined();
  });

  it("rejects when caloriesMin is a string", () => {
    const result = ParsedItemSchema.safeParse({
      name: "rice",
      quantity: "1 cup",
      caloriesMin: "200",
      caloriesMax: 250,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when name is empty", () => {
    const result = ParsedItemSchema.safeParse({
      name: "",
      quantity: "1 cup",
      caloriesMin: 200,
      caloriesMax: 250,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative calories", () => {
    const result = ParsedItemSchema.safeParse({
      name: "rice",
      quantity: "1 cup",
      caloriesMin: -10,
      caloriesMax: 250,
    });
    expect(result.success).toBe(false);
  });
});

describe("IntakeEntrySchema", () => {
  const valid = {
    id: "entry-1",
    inputText: "two scrambled eggs",
    confidence: "high",
    parsedItems: [],
    createdAt: "2024-01-01T12:00:00.000Z",
  };

  it("accepts a valid entry", () => {
    expect(IntakeEntrySchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional outputText", () => {
    const result = IntakeEntrySchema.safeParse({ ...valid, outputText: '{"items":[]}' });
    expect(result.success).toBe(true);
  });

  it("accepts all confidence values", () => {
    for (const confidence of ["low", "medium", "high"]) {
      expect(IntakeEntrySchema.safeParse({ ...valid, confidence }).success).toBe(true);
    }
  });

  it("rejects an invalid confidence value", () => {
    expect(IntakeEntrySchema.safeParse({ ...valid, confidence: "very high" }).success).toBe(false);
  });

  it("rejects when inputText is empty", () => {
    expect(IntakeEntrySchema.safeParse({ ...valid, inputText: "" }).success).toBe(false);
  });

  it("rejects an invalid createdAt format", () => {
    expect(IntakeEntrySchema.safeParse({ ...valid, createdAt: "not-a-date" }).success).toBe(false);
  });

  it("accepts parsedItems with valid items", () => {
    const result = IntakeEntrySchema.safeParse({
      ...valid,
      parsedItems: [{ name: "egg", quantity: "1", caloriesMin: 70, caloriesMax: 90 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("IntakeItemSchema", () => {
  const valid = {
    id: "item-1",
    name: "scrambled eggs",
    quantity: "2 eggs",
    caloriesMin: 140,
    caloriesMax: 200,
    consumedAt: "2024-01-01T12:00:00.000Z",
    source: "ai",
    createdAt: "2024-01-01T12:00:00.000Z",
    updatedAt: "2024-01-01T12:00:00.000Z",
  };

  it("accepts a valid item", () => {
    expect(IntakeItemSchema.safeParse(valid).success).toBe(true);
  });

  it("defaults editedByUser to false when omitted", () => {
    const result = IntakeItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.editedByUser).toBe(false);
  });

  it("accepts source manual", () => {
    expect(IntakeItemSchema.safeParse({ ...valid, source: "manual" }).success).toBe(true);
  });

  it("rejects an invalid source", () => {
    expect(IntakeItemSchema.safeParse({ ...valid, source: "user" }).success).toBe(false);
  });

  it("accepts optional processingId", () => {
    const result = IntakeItemSchema.safeParse({ ...valid, processingId: "entry-1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.processingId).toBe("entry-1");
  });

  it("accepts optional protein", () => {
    const result = IntakeItemSchema.safeParse({ ...valid, protein: 12 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.protein).toBe(12);
  });

  it("rejects negative protein", () => {
    expect(IntakeItemSchema.safeParse({ ...valid, protein: -1 }).success).toBe(false);
  });

  it("rejects an invalid consumedAt format", () => {
    expect(IntakeItemSchema.safeParse({ ...valid, consumedAt: "yesterday" }).success).toBe(false);
  });
});

describe("CreateEntryRequestSchema", () => {
  it("accepts a valid rawInput", () => {
    expect(CreateEntryRequestSchema.safeParse({ rawInput: "two eggs" }).success).toBe(true);
  });

  it("rejects an empty rawInput", () => {
    expect(CreateEntryRequestSchema.safeParse({ rawInput: "" }).success).toBe(false);
  });

  it("rejects when rawInput is missing", () => {
    expect(CreateEntryRequestSchema.safeParse({}).success).toBe(false);
  });
});
