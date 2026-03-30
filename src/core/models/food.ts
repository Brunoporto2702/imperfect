import { z } from "zod";

export const FoodItemSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  caloriesMin: z.number(),
  caloriesMax: z.number(),
  protein: z.number().optional(),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

export const FoodEntrySchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  rawInput: z.string(),
  imageUrl: z.string().optional(),
  items: z.array(FoodItemSchema),
  totalCaloriesMin: z.number(),
  totalCaloriesMax: z.number(),
  totalProtein: z.number().optional(),
  confidence: z.enum(["low", "medium", "high"]),
});

export type FoodEntry = z.infer<typeof FoodEntrySchema>;
