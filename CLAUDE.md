# CLAUDE.md
@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Imperfect** — an MVP AI-powered food tracking app. Users submit imperfect real-world input (text and optionally images) and receive estimated calories and protein as ranges.

Optimizing for: **shipping a usable product fast, not perfection.**

## Commands

> These will be populated once the project is bootstrapped. Expected commands:

```bash
npm run dev       # Start dev server (Next.js)
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

## Tech Stack (fixed — do not change)

- **Frontend**: Next.js (App Router)
- **Backend**: Next.js API routes
- **Validation**: Zod (all AI responses must be validated with Zod)
- **Database**: SQLite
- **AI**: OpenAI or Claude API

## Architecture

App Router structure (to be created):

```
app/
  page.tsx               # Main input UI
  api/
    entries/route.ts     # POST — accepts rawInput + optional imageUrl, parses with AI, validates, saves, returns FoodEntry
                          # GET — lists saved entries
lib/
  db.ts                  # SQLite client + minimal queries
  ai.ts                  # AI prompt + response parsing
  schema.ts              # Zod schemas (request/response/FoodEntry)
```

Core flow:
user submits text (+ optional image later) → POST /api/entries → AI prompt → Zod-validated response → computeTotals() → saved to SQLite → returned to UI

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
- `computeTotals()` in `route.ts` derives `totalCaloriesMin`, `totalCaloriesMax`, `totalProtein` from items before returning to the client
- Always return calorie **ranges** (min/max) per item — never a single exact number
- Use reasonable portion assumptions when not specified
- Prefer underconfidence over false precision
- AI output must be structured JSON, validated via Zod before use
- Prompt includes a valid/invalid example pair to reduce markdown-wrapped or plain-text responses

## Constraints

- No authentication
- Image input is optional and can be added after the text-only version is working
- No ORM at first
- No design system — UI is minimal and functional
- No new libraries without clear justification
- No premature optimization
- Do not expand scope beyond what is explicitly requested
