import { NextRequest, NextResponse } from "next/server";
import { CreateEntryRequestSchema } from "@/server/core/models/entry";
import { createEntry } from "@/server/core/services/food";
import { type AIProvider } from "@/server/core/logic/parser";
import { anthropicProvider } from "@/server/providers/ai.anthropic";

export function createHandler(provider: AIProvider) {
  return async function POST(request: NextRequest) {
    const body = await request.json();

    const result = CreateEntryRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    try {
      const entry = await createEntry(result.data.rawInput, provider);
      return NextResponse.json(entry);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse food";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export const POST = createHandler(anthropicProvider);
