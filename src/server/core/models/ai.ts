import { z } from "zod";
import { ParsedItemSchema } from "./food";

// Temporary — will be replaced by dto/ai.ts in the next commit
export const AiResponseSchema = z.object({
  items: z.array(ParsedItemSchema),
  confidence: z.enum(["low", "medium", "high"]),
});

export type AiResponse = z.infer<typeof AiResponseSchema>;
