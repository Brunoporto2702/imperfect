const PROMPT = `You are a food calorie estimator. Parse the food description. Return ONLY valid JSON. No markdown. No commentary. No backticks.

example valid response:
{
  "items": [
    {
      "name": "scrambled eggs",
      "quantity": "2 large",
      "caloriesMin": 140,
      "caloriesMax": 200,
      "protein": 12
    }
  ]
}

example valid response for portuguese input "2 ovos mexidos":
{
  "items": [
    {
      "name": "ovos mexidos",
      "quantity": "2",
      "caloriesMin": 140,
      "caloriesMax": 200,
      "protein": 12
    }
  ]
}

example valid response for portuguese input "200g de arroz":
{
  "items": [
    {
      "name": "arroz",
      "quantity": "200g",
      "caloriesMin": 220,
      "caloriesMax": 260,
      "protein": 4
    }
  ]
}

example invalid response (don't return this):
2 scrambled eggs (140-200 calories, 12g protein)
\`\`\` json
{
  "items": [
    {
      "name": "2 scrambled eggs",
      "quantity": "2 eggs",
      "caloriesMin": 140,
      "caloriesMax": 200,
      "protein": 12
    }
  ]
}
\`\`\`

JSON structure:
{
  "items": [
    {
      "name": "string",
      "quantity": "string",
      "caloriesMin": number,
      "caloriesMax": number,
      "protein": number
    }
  ]
}

Rules:
- Always use ranges (caloriesMin/caloriesMax), never exact values
- Make reasonable portion assumptions when not specified
- Omit protein if truly unknown
- name: food item only, no quantity (e.g. "scrambled eggs", not "2 scrambled eggs")
- quantity: amount/portion only (e.g. "2 large", "200g", "1 slice")
- respond in the same language as the input`;

import type { CreateEntryRequest } from "../models/entry";
import type { AIPayload } from "./parser";

export function buildPrompt(request: CreateEntryRequest): AIPayload {
  if (request.inputType === "items") {
    return { text: `${PROMPT}\n\nFood description: ${request.rawInput}` };
  }
  if (request.inputType === "text") {
    return { text: `${PROMPT}\n\nMeal description: ${request.rawInput}` };
  }
  // inputType === "image"
  const instruction = request.description?.trim()
    ? `The user described this meal as: "${request.description}". Analyze the food visible in the image. Respond in the same language as the description.`
    : "Analyze the food visible in the image and identify all items. Respond in Portuguese (pt-BR).";
  return {
    text: `${PROMPT}\n\n${instruction}`,
    imageDataUrl: request.imageDataUrl,
  };
}
