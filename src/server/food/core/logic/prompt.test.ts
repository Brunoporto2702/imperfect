import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt";

describe("buildPrompt", () => {
  describe("inputType: items", () => {
    it("returns text containing the rawInput", () => {
      const { text } = buildPrompt({ inputType: "items", rawInput: "two eggs" });
      expect(text).toContain("two eggs");
    });

    it("does not include imageDataUrl", () => {
      const payload = buildPrompt({ inputType: "items", rawInput: "two eggs" });
      expect(payload.imageDataUrl).toBeUndefined();
    });

    it("includes Food description label", () => {
      const { text } = buildPrompt({ inputType: "items", rawInput: "200g rice" });
      expect(text).toContain("Food description: 200g rice");
    });
  });

  describe("inputType: image", () => {
    it("returns the imageDataUrl", () => {
      const { imageDataUrl } = buildPrompt({
        inputType: "image",
        imageDataUrl: "data:image/jpeg;base64,abc",
      });
      expect(imageDataUrl).toBe("data:image/jpeg;base64,abc");
    });

    it("includes image analysis instruction when no description", () => {
      const { text } = buildPrompt({
        inputType: "image",
        imageDataUrl: "data:image/jpeg;base64,abc",
      });
      expect(text).toContain("Analyze the food visible in the image");
    });

    it("includes the description when provided", () => {
      const { text } = buildPrompt({
        inputType: "image",
        imageDataUrl: "data:image/jpeg;base64,abc",
        description: "frango grelhado",
      });
      expect(text).toContain("frango grelhado");
    });

    it("falls back to image instruction when description is blank", () => {
      const { text } = buildPrompt({
        inputType: "image",
        imageDataUrl: "data:image/jpeg;base64,abc",
        description: "   ",
      });
      expect(text).toContain("Analyze the food visible in the image");
    });
  });
});
