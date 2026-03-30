import { z } from "zod";
import { FoodItemSchema } from "./food";

// AI response schema — excludes server-generated fields (id, createdAt, rawInput)
// and computed fields (totalCaloriesMin, totalCaloriesMax, totalProtein)
export const AiResponseSchema = z.object({
  items: z.array(FoodItemSchema),
  confidence: z.enum(["low", "medium", "high"]),
});

export type AiResponse = z.infer<typeof AiResponseSchema>;
