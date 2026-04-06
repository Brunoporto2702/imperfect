import { z } from "zod";

const ItemsEntryRequestSchema = z.object({
  inputType: z.literal("items"),
  rawInput: z.string().min(1),
});

const ImageEntryRequestSchema = z.object({
  inputType: z.literal("image"),
  imageDataUrl: z.string().startsWith("data:image/"),
  description: z.string().optional(),
});

export const CreateEntryRequestSchema = z.discriminatedUnion("inputType", [
  ItemsEntryRequestSchema,
  ImageEntryRequestSchema,
]);

export type CreateEntryRequest = z.infer<typeof CreateEntryRequestSchema>;
