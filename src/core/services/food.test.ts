import { describe, it, expect, vi } from "vitest";
import { createEntry } from "./food";
import type { AIProvider } from "../logic/parser";

const validAIResponse = JSON.stringify({
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
  confidence: "high",
});

describe("createEntry", () => {
  it("returns a FoodEntry with computed totals", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);

    const result = await createEntry("two eggs", provider);

    expect(result.totalCaloriesMin).toBe(140);
    expect(result.totalCaloriesMax).toBe(200);
    expect(result.totalProtein).toBe(12);
    expect(result.confidence).toBe("high");
  });

  it("calls the provider with the prepared prompt", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);

    await createEntry("two eggs", provider);

    const calledWith = (provider as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledWith).toContain("two eggs");
  });

  it("propagates errors from the provider", async () => {
    const provider: AIProvider = vi.fn().mockRejectedValue(new Error("network failure"));

    await expect(createEntry("two eggs", provider)).rejects.toThrow("network failure");
  });

  it("throws when provider returns unparseable text", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue("not json at all");

    await expect(createEntry("two eggs", provider)).rejects.toThrow("AI returned non-JSON response");
  });

  it("omits totalProtein when no items have protein", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(
      JSON.stringify({
        items: [{ name: "rice", quantity: "1 cup", caloriesMin: 200, caloriesMax: 250 }],
        confidence: "medium",
      })
    );

    const result = await createEntry("rice", provider);
    expect(result.totalProtein).toBeUndefined();
  });
});
