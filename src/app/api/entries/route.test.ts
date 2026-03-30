import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHandler } from "./route";
import type { AIProvider } from "@/server/core/logic/parser";

const validAIResponse = JSON.stringify({
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
  confidence: "high",
});

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST handler", () => {
  it("returns 200 with a complete FoodEntry on success", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);
    const POST = createHandler(provider);

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.rawInput).toBe("two eggs");
    expect(body.totalCaloriesMin).toBe(140);
    expect(body.totalCaloriesMax).toBe(200);
    expect(body.totalProtein).toBe(12);
  });

  it("returns 400 and does not call provider when rawInput is empty", async () => {
    const provider: AIProvider = vi.fn();
    const POST = createHandler(provider);

    const res = await POST(makeRequest({ rawInput: "" }));
    expect(res.status).toBe(400);
    expect(provider).not.toHaveBeenCalled();
  });

  it("returns 400 when rawInput is missing", async () => {
    const POST = createHandler(vi.fn());

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 500 with the error message when provider throws an Error", async () => {
    const provider: AIProvider = vi.fn().mockRejectedValue(new Error("network failure"));
    const POST = createHandler(provider);

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("network failure");
  });

  it("returns 500 with fallback message when provider throws a non-Error", async () => {
    const provider: AIProvider = vi.fn().mockRejectedValue("something went wrong");
    const POST = createHandler(provider);

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to parse food");
  });
});
