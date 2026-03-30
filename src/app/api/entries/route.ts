import { NextRequest, NextResponse } from "next/server";
import { CreateEntryRequestSchema } from "@/core/models/entry";
import { createFoodService, type FoodService } from "@/core/services/food";
import { anthropicProvider } from "@/providers/ai.anthropic";

export function createHandler(service: FoodService) {
  return async function POST(request: NextRequest) {
    const body = await request.json();

    const result = CreateEntryRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    try {
      const entry = await service.createEntry(result.data.rawInput);
      return NextResponse.json(entry);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse food";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export const POST = createHandler(createFoodService(anthropicProvider));
