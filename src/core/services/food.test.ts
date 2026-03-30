import { describe, it, expect, vi } from "vitest";
import { createFoodService } from "./food";
import type { AIProvider } from "../logic/parser";
import type { FoodEntry } from "../models/food";

const validAIResponse = JSON.stringify({
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
  confidence: "high",
});

describe("createFoodService", () => {
  it("returns a FoodEntry with computed totals", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);
    const service = createFoodService(provider);

    const result = await service.createEntry("two eggs");

    expect(result.totalCaloriesMin).toBe(140);
    expect(result.totalCaloriesMax).toBe(200);
    expect(result.totalProtein).toBe(12);
    expect(result.confidence).toBe("high");
  });

  it("calls the provider with the prepared prompt", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);
    const service = createFoodService(provider);

    await service.createEntry("two eggs");

    const calledWith = (provider as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledWith).toContain("two eggs");
  });

  it("propagates errors from the provider", async () => {
    const provider: AIProvider = vi.fn().mockRejectedValue(new Error("network failure"));
    const service = createFoodService(provider);

    await expect(service.createEntry("two eggs")).rejects.toThrow("network failure");
  });

  it("throws when provider returns unparseable text", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue("not json at all");
    const service = createFoodService(provider);

    await expect(service.createEntry("two eggs")).rejects.toThrow("AI returned non-JSON response");
  });

  it("omits totalProtein when no items have protein", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(
      JSON.stringify({
        items: [{ name: "rice", quantity: "1 cup", caloriesMin: 200, caloriesMax: 250 }],
        confidence: "medium",
      })
    );
    const service = createFoodService(provider);

    const result = await service.createEntry("rice");
    expect(result.totalProtein).toBeUndefined();
  });
});
