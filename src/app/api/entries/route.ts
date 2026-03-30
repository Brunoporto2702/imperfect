import { NextRequest, NextResponse } from "next/server";
import { CreateEntryRequestSchema, FoodEntry } from "@/lib/schema";
import type { AIParser } from "@/lib/ai";
import { parseFood } from "@/lib/ai.anthropic";

export function computeTotals(
  entry: Omit<FoodEntry, "totalCaloriesMin" | "totalCaloriesMax" | "totalProtein">
): FoodEntry {
  return {
    ...entry,
    totalCaloriesMin: entry.items.reduce((sum, item) => sum + item.caloriesMin, 0),
    totalCaloriesMax: entry.items.reduce((sum, item) => sum + item.caloriesMax, 0),
    totalProtein: entry.items.every((item) => item.protein == null)
      ? undefined
      : entry.items.reduce((sum, item) => sum + (item.protein ?? 0), 0),
  };
}

export function createHandler(parser: AIParser) {
  return async function POST(request: NextRequest) {
    const body = await request.json();

    const result = CreateEntryRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    try {
      const entry = computeTotals(await parser(result.data.rawInput));
      return NextResponse.json(entry);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse food";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export const POST = createHandler(parseFood);
