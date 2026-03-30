import { describe, it, expect } from "vitest";
import { sanitizeInput, parseAIResponse } from "./parser";

describe("sanitizeInput", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("collapses newlines and multiple spaces into a single space", () => {
    expect(sanitizeInput("hello\n  world")).toBe("hello world");
  });

  it("extracts JSON block when surrounded by prose", () => {
    const input = 'Here is the result: {"foo": "bar"} that is all';
    expect(sanitizeInput(input)).toBe('{"foo": "bar"}');
  });

  it("extracts JSON from a markdown code block", () => {
    const input = "```json\n{\"foo\": \"bar\"}\n```";
    expect(sanitizeInput(input)).toBe('{"foo": "bar"}');
  });

  it("returns trimmed string when no JSON block is found", () => {
    expect(sanitizeInput("  no json here  ")).toBe("no json here");
  });
});

describe("parseAIResponse", () => {
  const validPayload = {
    items: [
      { name: "scrambled eggs", quantity: "2 eggs", caloriesMin: 140, caloriesMax: 200, protein: 12 },
    ],
    confidence: "high",
  };

  it("returns a correctly shaped entry for valid JSON", () => {
    const result = parseAIResponse(JSON.stringify(validPayload), "two eggs");
    expect(result.rawInput).toBe("two eggs");
    expect(result.items).toHaveLength(1);
    expect(result.confidence).toBe("high");
    expect(typeof result.id).toBe("string");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("preserves optional protein on items", () => {
    const result = parseAIResponse(JSON.stringify(validPayload), "two eggs");
    expect(result.items[0].protein).toBe(12);
  });

  it("leaves protein undefined when omitted from items", () => {
    const payload = {
      items: [{ name: "rice", quantity: "1 cup", caloriesMin: 200, caloriesMax: 250 }],
      confidence: "medium",
    };
    const result = parseAIResponse(JSON.stringify(payload), "rice");
    expect(result.items[0].protein).toBeUndefined();
  });

  it("throws when AI returns plain text instead of JSON", () => {
    expect(() => parseAIResponse("two eggs, about 140 calories", "two eggs")).toThrow(
      "AI returned non-JSON response"
    );
  });

  it("throws when JSON does not match the schema", () => {
    const bad = { items: [], confidence: "very high" };
    expect(() => parseAIResponse(JSON.stringify(bad), "two eggs")).toThrow();
  });

  it("handles JSON wrapped in markdown backticks", () => {
    const wrapped = "```json\n" + JSON.stringify(validPayload) + "\n```";
    const result = parseAIResponse(wrapped, "two eggs");
    expect(result.confidence).toBe("high");
  });
});
