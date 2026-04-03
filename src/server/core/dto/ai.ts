import { z } from "zod";

/**
 * Wire shape returned by the AI provider — validated at the boundary
 * before being mapped into domain types.
 */
export const AiResponseDtoSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.string().min(1),
      caloriesMin: z.number().nonnegative(),
      caloriesMax: z.number().nonnegative(),
      protein: z.number().nonnegative().optional(),
    })
  ),
});

export type AiResponseDto = z.infer<typeof AiResponseDtoSchema>;
