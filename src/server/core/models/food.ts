import { z } from "zod";

export const ParsedItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  caloriesMin: z.number().nonnegative(),
  caloriesMax: z.number().nonnegative(),
  protein: z.number().nonnegative().optional(),
});

export const IntakeEntrySchema = z.object({
  id: z.string(),
  inputText: z.string().min(1),
  outputText: z.string().optional(),
  parsedItems: z.array(ParsedItemSchema),
  createdAt: z.string().datetime(),
});

export const IntakeItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  quantity: z.string().min(1),
  caloriesMin: z.number().nonnegative(),
  caloriesMax: z.number().nonnegative(),
  protein: z.number().nonnegative().optional(),
  consumedAt: z.string().datetime(),
  source: z.enum(["ai", "manual"]),
  processingId: z.string().optional(),
  editedByUser: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ParsedItem = z.infer<typeof ParsedItemSchema>;
export type IntakeEntry = z.infer<typeof IntakeEntrySchema>;
export type IntakeItem = z.infer<typeof IntakeItemSchema>;
