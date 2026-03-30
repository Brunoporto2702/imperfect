# CLAUDE.md
@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Imperfect** — an MVP AI-powered food tracking app. Users submit imperfect real-world input (text and optionally images) and receive estimated calories and protein as ranges.

Optimizing for: **shipping a usable product fast, not perfection.**

## Commands

```bash
npm run dev       # Start dev server (Next.js)
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
npm test          # Vitest (unit + integration)
```

## Tech Stack (fixed — do not change)

- **Frontend**: Next.js (App Router)
- **Backend**: Next.js API routes
- **Validation**: Zod (all AI responses must be validated with Zod)
- **Testing**: Vitest
- **Database**: SQLite (not yet added)
- **AI**: Anthropic Claude (via @anthropic-ai/sdk)

## Architecture

Ports and adapters on the backend. Feature-Sliced Design on the frontend.

```
src/
  app/
    page.tsx                          # Shell — renders FoodPage
    api/entries/route.ts              # POST /api/entries — wires provider, delegates to service

  server/
    core/                             # Domain — no framework dependencies
      models/
        food.ts                       # FoodItemSchema, FoodEntrySchema, types
        ai.ts                         # AiResponseSchema
        entry.ts                      # CreateEntryRequestSchema
      logic/
        prompt.ts                     # PROMPT + buildPrompt(rawInput)
        parser.ts                     # AIProvider port + sanitizeInput + parseAIResponse
        food.ts                       # computeTotals (pure function)
      services/
        food.ts                       # createEntry(rawInput, provider) — plain function
    providers/
      ai.anthropic.ts                 # Anthropic adapter implementing AIProvider

  client/
    infra/
      http.ts                         # Generic fetch wrapper
      storage.ts                      # Generic localStorage wrapper
    features/
      entries/
        api.ts                        # createEntry(rawInput) — calls POST /api/entries
        history.ts                    # loadHistory / saveHistory — uses storage infra
    components/
      EntryCard.tsx                   # Pure UI component
      FoodPage.tsx                    # Main page component
```

Core flow:
user submits text → `FoodPage` → `features/entries/api` → POST /api/entries → `createEntry(rawInput, provider)` → `buildPrompt` → AI → `parseAIResponse` → `computeTotals` → returned to UI → saved to localStorage history

## Data Model (must follow exactly)

```ts
FoodEntry {
  id: string
  createdAt: Date
  rawInput: string
  imageUrl?: string
  items: Array<{
    name: string
    quantity: string
    caloriesMin: number
    caloriesMax: number
    protein?: number
  }>
  totalCaloriesMin: number
  totalCaloriesMax: number
  totalProtein?: number
  confidence: "low" | "medium" | "high"
}
```

## Input contract

```ts
type CreateEntryRequest = {
  rawInput: string
  imageUrl?: string
}
```

## AI Parsing Rules

- AI returns only `items` + `confidence` — totals are **never** part of the AI response
- `computeTotals()` derives `totalCaloriesMin`, `totalCaloriesMax`, `totalProtein` from items
- Always return calorie **ranges** (min/max) per item — never a single exact number
- Use reasonable portion assumptions when not specified
- Prefer underconfidence over false precision
- AI output must be structured JSON, validated via Zod before use
- Prompt includes a valid/invalid example pair to reduce markdown-wrapped or plain-text responses

## Architectural rules

- **Providers are pure transport** — they receive a pre-built message string and return a raw string. No domain logic (no `buildPrompt`, no parsing) inside providers.
- **Core has no framework dependencies** — nothing in `server/core/` should import from Next.js or any provider.
- **Services are plain functions** — `createEntry(rawInput, provider)` takes explicit dependencies, no factory needed.
- **`createHandler(provider)`** in route.ts exists for controller-level testability only.
- **Client infra is generic** — `http.ts` and `storage.ts` know nothing about entries. Features compose them.

## Constraints

- No authentication (yet — keep things separated so it's easy to add later)
- Image input deferred until text-only version is solid
- No ORM
- No design system — UI is minimal and functional
- No new libraries without clear justification
- No premature optimization
- Do not expand scope beyond what is explicitly requested
