import { describe, it, expect, vi } from "vitest";
import { createEntry } from "./food";
import type { AIProvider } from "../logic/parser";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";

const validAIResponse = JSON.stringify({
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
});

function makeDb(): SqlDb {
  return {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    batch: vi.fn().mockResolvedValue(undefined),
  };
}

describe("createEntry", () => {
  it("returns an IntakeEntry and IntakeItem[]", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);

    const { intakeEntry, intakeItems } = await createEntry("two eggs", provider, makeDb());

    expect(intakeEntry.inputText).toBe("two eggs");
    expect(intakeEntry.parsedItems).toHaveLength(1);
    expect(intakeItems).toHaveLength(1);
  });

  it("intakeItems carry calorie and protein values from parsedItems", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);

    const { intakeItems } = await createEntry("two eggs", provider, makeDb());
    const [item] = intakeItems;

    expect(item.caloriesMin).toBe(140);
    expect(item.caloriesMax).toBe(200);
    expect(item.protein).toBe(12);
  });

  it("intakeItems are linked to the intakeEntry via processingId", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);

    const { intakeEntry, intakeItems } = await createEntry("two eggs", provider, makeDb());

    expect(intakeItems[0].processingId).toBe(intakeEntry.id);
  });

  it("calls the provider with the prepared prompt", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);

    await createEntry("two eggs", provider, makeDb());

    const calledWith = (provider as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledWith).toContain("two eggs");
  });

  it("propagates errors from the provider", async () => {
    const provider: AIProvider = vi.fn().mockRejectedValue(new Error("network failure"));

    await expect(createEntry("two eggs", provider, makeDb())).rejects.toThrow("network failure");
  });

  it("throws when provider returns unparseable text", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue("not json at all");

    await expect(createEntry("two eggs", provider, makeDb())).rejects.toThrow("AI returned non-JSON response");
  });

  it("leaves protein undefined on items when not in AI response", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(
      JSON.stringify({
        items: [{ name: "rice", quantity: "1 cup", caloriesMin: 200, caloriesMax: 250 }],
      })
    );

    const { intakeItems } = await createEntry("rice", provider, makeDb());
    expect(intakeItems[0].protein).toBeUndefined();
  });
});
