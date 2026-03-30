import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHandler, computeTotals } from "./route";
import type { AIParser } from "@/lib/ai";
import type { FoodEntry } from "@/lib/schema";

const baseEntry: Omit<FoodEntry, "totalCaloriesMin" | "totalCaloriesMax" | "totalProtein"> = {
  id: "test-id",
  createdAt: new Date("2024-01-01"),
  rawInput: "two eggs",
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
  confidence: "high",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

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

describe("POST handler", () => {
  it("returns 200 with a complete FoodEntry on success", async () => {
    const parser: AIParser = vi.fn().mockResolvedValue(baseEntry);
    const POST = createHandler(parser);

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.rawInput).toBe("two eggs");
    expect(body.totalCaloriesMin).toBe(140);
    expect(body.totalCaloriesMax).toBe(200);
    expect(body.totalProtein).toBe(12);
    expect(body.confidence).toBe("high");
  });

  it("returns 400 and does not call parser when rawInput is empty", async () => {
    const parser: AIParser = vi.fn();
    const POST = createHandler(parser);

    const res = await POST(makeRequest({ rawInput: "" }));
    expect(res.status).toBe(400);
    expect(parser).not.toHaveBeenCalled();
  });

  it("returns 400 when rawInput is missing", async () => {
    const parser: AIParser = vi.fn();
    const POST = createHandler(parser);

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 500 with the error message when parser throws an Error", async () => {
    const parser: AIParser = vi.fn().mockRejectedValue(new Error("AI returned non-JSON response"));
    const POST = createHandler(parser);

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("AI returned non-JSON response");
  });

  it("returns 500 with fallback message when parser throws a non-Error", async () => {
    const parser: AIParser = vi.fn().mockRejectedValue("something went wrong");
    const POST = createHandler(parser);

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to parse food");
  });

  it("omits totalProtein in response when no items have protein", async () => {
    const parser: AIParser = vi.fn().mockResolvedValue({
      ...baseEntry,
      items: [{ name: "rice", quantity: "1 cup", caloriesMin: 200, caloriesMax: 250 }],
    });
    const POST = createHandler(parser);

    const body = await (await POST(makeRequest({ rawInput: "rice" }))).json();
    expect(body.totalProtein).toBeUndefined();
  });
});
