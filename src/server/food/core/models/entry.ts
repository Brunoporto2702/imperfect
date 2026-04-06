import { z } from "zod";

export const CreateEntryRequestSchema = z.object({
  rawInput: z.string().min(1),
});

export type CreateEntryRequest = z.infer<typeof CreateEntryRequestSchema>;
