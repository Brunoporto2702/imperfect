import { NextRequest, NextResponse } from "next/server";
import { CreateEntryRequestSchema } from "@/lib/schema";
import { parseFood } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = CreateEntryRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  try {
    const entry = await parseFood(result.data.rawInput);
    return NextResponse.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse food";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
