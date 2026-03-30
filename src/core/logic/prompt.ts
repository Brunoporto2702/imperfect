const PROMPT = `You are a food calorie estimator. Parse the food description. Return ONLY valid JSON. No markdown. No commentary. No backticks.

example valid response:
{
  "items": [
    {
      "name": "2 scrambled eggs",
      "quantity": "2 eggs",
      "caloriesMin": 140,
      "caloriesMax": 200,
      "protein": 12
    }
  ],
  "confidence": "high"
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
  ],
  "confidence": "high"
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
  ],
  "confidence": "low" | "medium" | "high"
}

Rules:
- Always use ranges (caloriesMin/caloriesMax), never exact values
- Make reasonable portion assumptions when not specified
- confidence: "high" = clearly described, "medium" = portions assumed, "low" = vague description
- Omit protein if truly unknown`;

export function buildPrompt(rawInput: string): string {
  return `${PROMPT}\n\nFood description: ${rawInput}`;
}
