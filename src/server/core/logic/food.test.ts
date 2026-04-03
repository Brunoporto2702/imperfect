import { describe, it, expect } from "vitest";
import { buildIntakeItems } from "./food";
import type { IntakeEntry } from "../models/food";

const baseEntry: IntakeEntry = {
  id: "entry-1",
  inputText: "two eggs",
  outputText: '{"items":[]}',
  parsedItems: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
  createdAt: "2024-01-01T12:00:00.000Z",
};

describe("buildIntakeItems", () => {
  it("returns one IntakeItem per parsedItem", () => {
    const items = buildIntakeItems(baseEntry);
    expect(items).toHaveLength(1);
  });

  it("maps name, quantity, and calorie range correctly", () => {
    const [item] = buildIntakeItems(baseEntry);
    expect(item.name).toBe("scrambled eggs");
    expect(item.quantity).toBe("2 eggs");
    expect(item.caloriesMin).toBe(140);
    expect(item.caloriesMax).toBe(200);
  });

  it("preserves optional protein", () => {
    const [item] = buildIntakeItems(baseEntry);
    expect(item.protein).toBe(12);
  });

  it("leaves protein undefined when omitted from parsedItem", () => {
    const entry: IntakeEntry = {
      ...baseEntry,
      parsedItems: [{ name: "rice", quantity: "1 cup", caloriesMin: 200, caloriesMax: 250 }],
    };
    const [item] = buildIntakeItems(entry);
    expect(item.protein).toBeUndefined();
  });

  it("sets source to ai", () => {
    const [item] = buildIntakeItems(baseEntry);
    expect(item.source).toBe("ai");
  });

  it("links processingId to the IntakeEntry id", () => {
    const [item] = buildIntakeItems(baseEntry);
    expect(item.processingId).toBe("entry-1");
  });

  it("sets consumedAt to the entry createdAt", () => {
    const [item] = buildIntakeItems(baseEntry);
    expect(item.consumedAt).toBe(baseEntry.createdAt);
  });

  it("defaults editedByUser to false", () => {
    const [item] = buildIntakeItems(baseEntry);
    expect(item.editedByUser).toBe(false);
  });

  it("assigns unique ids to each item", () => {
    const entry: IntakeEntry = {
      ...baseEntry,
      parsedItems: [
        { name: "egg", quantity: "1", caloriesMin: 70, caloriesMax: 90 },
        { name: "toast", quantity: "1 slice", caloriesMin: 80, caloriesMax: 100 },
      ],
    };
    const items = buildIntakeItems(entry);
    expect(items[0].id).not.toBe(items[1].id);
  });

  it("returns an empty array for an entry with no parsedItems", () => {
    const entry: IntakeEntry = { ...baseEntry, parsedItems: [] };
    expect(buildIntakeItems(entry)).toHaveLength(0);
  });
});
