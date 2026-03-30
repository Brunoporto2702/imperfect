import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHandler } from "./route";
import type { FoodService } from "@/core/services/food";
import type { FoodEntry } from "@/core/models/food";

const fullEntry: FoodEntry = {
  id: "test-id",
  createdAt: new Date("2024-01-01"),
  rawInput: "two eggs",
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
  totalCaloriesMin: 140,
  totalCaloriesMax: 200,
  totalProtein: 12,
  confidence: "high",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockService(overrides?: Partial<FoodService>): FoodService {
  return {
    createEntry: vi.fn().mockResolvedValue(fullEntry),
    ...overrides,
  };
}

describe("POST handler", () => {
  it("returns 200 with the service result on success", async () => {
    const POST = createHandler(mockService());

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.rawInput).toBe("two eggs");
    expect(body.totalCaloriesMin).toBe(140);
    expect(body.totalCaloriesMax).toBe(200);
    expect(body.totalProtein).toBe(12);
  });

  it("returns 400 and does not call service when rawInput is empty", async () => {
    const service = mockService();
    const POST = createHandler(service);

    const res = await POST(makeRequest({ rawInput: "" }));
    expect(res.status).toBe(400);
    expect(service.createEntry).not.toHaveBeenCalled();
  });

  it("returns 400 when rawInput is missing", async () => {
    const POST = createHandler(mockService());

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 500 with the error message when service throws an Error", async () => {
    const POST = createHandler(
      mockService({ createEntry: vi.fn().mockRejectedValue(new Error("AI returned non-JSON response")) })
    );

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("AI returned non-JSON response");
  });

  it("returns 500 with fallback message when service throws a non-Error", async () => {
    const POST = createHandler(
      mockService({ createEntry: vi.fn().mockRejectedValue("something went wrong") })
    );

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to parse food");
  });
});
