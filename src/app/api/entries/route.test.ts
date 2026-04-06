import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHandler } from "./route";
import type { AIProvider } from "@/server/food/core/logic/parser";
import type { SqlDb } from "@/server/lib/sql-db/sql-db";

const validAIResponse = JSON.stringify({
  items: [
    { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
  ],
});

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDb(): SqlDb {
  return {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    batch: vi.fn().mockResolvedValue(undefined),
  };
}

describe("POST handler", () => {
  it("returns 200 with intakeEntry and intakeItems on success", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);
    const POST = createHandler(provider, makeDb());

    const res = await POST(makeRequest({ inputType: "items", rawInput: "two eggs" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.intakeEntry.inputText).toBe("two eggs");
    expect(body.intakeItems).toHaveLength(1);
    expect(body.intakeItems[0].caloriesMin).toBe(140);
    expect(body.intakeItems[0].caloriesMax).toBe(200);
    expect(body.intakeItems[0].protein).toBe(12);
    expect(body.intakeItems[0].processingId).toBe(body.intakeEntry.id);
  });

  it("returns 400 and does not call provider when rawInput is empty", async () => {
    const provider: AIProvider = vi.fn();
    const POST = createHandler(provider, makeDb());

    const res = await POST(makeRequest({ inputType: "items", rawInput: "" }));
    expect(res.status).toBe(400);
    expect(provider).not.toHaveBeenCalled();
  });

  it("returns 400 when inputType is missing", async () => {
    const POST = createHandler(vi.fn(), makeDb());

    const res = await POST(makeRequest({ rawInput: "two eggs" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 for image input", async () => {
    const provider: AIProvider = vi.fn().mockResolvedValue(validAIResponse);
    const POST = createHandler(provider, makeDb());

    const res = await POST(makeRequest({ inputType: "image", imageDataUrl: "data:image/jpeg;base64,abc" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.intakeEntry.inputText).toBe("[image]");
    expect(body.intakeItems).toHaveLength(1);
  });

  it("returns 500 with the error message when provider throws an Error", async () => {
    const provider: AIProvider = vi.fn().mockRejectedValue(new Error("network failure"));
    const POST = createHandler(provider, makeDb());

    const res = await POST(makeRequest({ inputType: "items", rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("network failure");
  });

  it("returns 500 with fallback message when provider throws a non-Error", async () => {
    const provider: AIProvider = vi.fn().mockRejectedValue("something went wrong");
    const POST = createHandler(provider, makeDb());

    const res = await POST(makeRequest({ inputType: "items", rawInput: "two eggs" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to parse food");
  });
});
