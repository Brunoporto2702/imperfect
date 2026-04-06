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
npx tsc --noEmit  # Type check
npm test          # Vitest (unit + integration)
```

## Tech Stack (fixed — do not change)

- **Frontend**: Next.js 16 (App Router)
- **Backend**: Next.js API routes
- **Validation**: Zod (all AI responses must be validated with Zod)
- **Testing**: Vitest
- **Database**: libsql/Turso (SQLite locally via `file:local.db`, Turso in prod)
- **AI**: Anthropic Claude (via @anthropic-ai/sdk)

## Architecture

```
src/
  app/
    page.tsx                              # / — renders DashboardPage
    new/page.tsx                          # /new — renders NewEntryPage
    items/page.tsx                        # /items — renders ItemsPage
    items/[id]/page.tsx                   # /items/[id] — renders EditItemPage
    log/page.tsx                          # /log — renders LogPage
    api/entries/route.ts                  # POST /api/entries — wires db + provider, delegates to service
  instrumentation.ts                      # runs migrations once on server startup

  server/
    food/                                 # Food domain
      core/                               # Pure domain logic — no framework or infra dependencies
        models/
          food.ts                         # IntakeEntrySchema, IntakeItemSchema, ParsedItemSchema, types
          entry.ts                        # CreateEntryRequestSchema
        dto/
          ai.ts                           # AiResponseDtoSchema — wire shape from AI provider
        logic/
          prompt.ts                       # PROMPT + buildPrompt(rawInput)
          parser.ts                       # AIProvider type + sanitizeInput + parseAIResponse → IntakeEntry
          food.ts                         # buildIntakeItems(IntakeEntry) → IntakeItem[]
        services/
          food.ts                         # createEntry(rawInput, provider, db) → { intakeEntry, intakeItems }
      providers/
        ai/
          anthropic.ts                    # Anthropic adapter implementing AIProvider
        persistence/
          sql/
            entry.ts                      # save(db, entry) — SQL persistence for IntakeEntry
      migrations/
        index.ts                          # Migration list (SQL inline as TS strings)

    lib/
      sqldb/                              # Generic DB infrastructure — no domain knowledge
        sql-db.ts                         # SqlDb interface: execute + batch
        libsql-db.ts                      # createLibSqlDb(config) → SqlDb  (Turso/libsql)
        in-memory-db.ts                   # createInMemoryDb() → SqlDb  (:memory:, for tests)
        migration-runner.ts               # runMigrations(db, migrations) — idempotent
        index.ts                          # barrel re-exports

  client/
    infra/
      http.ts                             # Generic fetch wrapper
      storage.ts                          # Generic localStorage wrapper
      toast.tsx                           # ToastContext + useToast hook + ToastProvider
    features/
      entries/
        api.ts                            # createEntry(rawInput) → { intakeEntry, intakeItems }
        intakeEntries.ts                  # load / save / add IntakeEntry[] (append-only)
        intakeItems.ts                    # load / save / add / delete / update IntakeItem[]
      profile/
        target.ts                         # loadTarget / saveTarget — daily kcal target
    logic/
      entries.ts                          # getWeeklyStats, getDaySummaries, getWeeklyInsight — pure, over IntakeItem[]
      chart.ts                            # buildWeeklyChart + DayBar type — pure, IntakeItem[] → chart data
    pages/
      DashboardPage.tsx                   # Weekly stats + insight + chart + day summaries + FAB
      NewEntryPage.tsx                    # Item-by-item input → staged list → AI preview → accept/discard → toast + redirect
      ItemsPage.tsx                       # Day-grouped IntakeItem list with edit + delete
      EditItemPage.tsx                    # Edit single IntakeItem form
      LogPage.tsx                         # Read-only IntakeEntry audit log (original AI output)
    components/
      Header.tsx                          # Global nav — logo + Items + Log links, active state
      WeeklyCaloriesChart.tsx             # SVG box plot — daily cal ranges + optional target line
      ItemInput.tsx                       # Autocomplete input + qty field + Add button (pure — receives suggestions as prop)
```

Client layer rules:
- **`logic/`** — pure functions over domain data. No framework dependencies, no side effects. Mirrors `server/food/core/logic/`.
- **`pages/`** — page-level components: own layout, route logic, and business orchestration. Not reused across routes.
- **`components/`** — reusable atoms with no route awareness or side effects.
- **`infra/`** — generic wrappers. Know nothing about domain types.
- **`features/`** — domain-aware storage and API. Compose infra.

Core flow:
user adds items one-by-one (name + qty) → staged list in `NewEntryPage` → joined as `rawInput` → `features/entries/api` → POST /api/entries → `createEntry(rawInput, provider, db)` → `buildPrompt` → AI → `parseAIResponse` → `buildIntakeItems` → `EntryRepository.save(db, entry)` → previewed in UI → on accept: saved to localStorage (intakeEntries + intakeItems) → toast + redirect to dashboard

## Data Model (must follow exactly)

```ts
// Immutable AI interaction record
IntakeEntry {
  id: string
  inputText: string
  outputText?: string
  parsedItems: ParsedItem[]             // original AI snapshot — never mutated
  createdAt: string                     // ISO datetime
}

// AI-parsed item snapshot (lives inside IntakeEntry)
ParsedItem {
  name: string
  quantity: string
  caloriesMin: number
  caloriesMax: number
  protein?: number
}

// Atomic editable unit
IntakeItem {
  id: string
  name: string
  quantity: string
  caloriesMin: number
  caloriesMax: number
  protein?: number
  consumedAt: string                    // ISO datetime — the semantically meaningful date
  source: "ai" | "manual"
  processingId?: string                 // links back to IntakeEntry
  editedByUser: boolean
  createdAt: string                     // ISO datetime
  updatedAt: string                     // ISO datetime
}
```

## Input contract

```ts
type CreateEntryRequest = {
  rawInput: string
}
```

## AI Parsing Rules

- AI returns only `items` — validated via `AiResponseDtoSchema` at the provider boundary
- `buildIntakeItems()` maps `ParsedItem[]` → `IntakeItem[]`, never the other way
- Always return calorie **ranges** (min/max) per item — never a single exact number
- Use reasonable portion assumptions when not specified
- Prefer underconfidence over false precision
- AI output must be structured JSON, validated via Zod before use
- Prompt includes multiple few-shot examples (EN + PT) to anchor name/quantity separation and language matching
- **few-shot examples carry more weight than rules** — if a rule isn't sticking, add a concrete example in the target language

## Architectural rules

- **`server/food/core/` has no infra dependencies** — nothing in core imports from Next.js, libsql, or any provider.
- **`server/lib/sqldb/` is generic** — no domain knowledge. Knows nothing about food, entries, or migrations content.
- **Persistence functions are plain exports** — `save(db, entry)` in `sql/entry.ts`. No class, no factory, no object.
- **`createEntry(rawInput, provider, db)`** — service consciously receives `SqlDb`. Explicit decision, not hidden behind an interface.
- **`createHandler(provider, db)`** in route.ts exists for controller-level testability only. `POST` is the production wiring.
- **Migrations run in `instrumentation.ts`** — once on server startup, before any requests. `runMigrations` is idempotent.
- **Tests use `createInMemoryDb()`** — real SQL, zero disk, isolated per instance.
- **Client infra is generic** — `http.ts`, `storage.ts`, `toast.tsx` know nothing about domain types. Features compose them.
- **`IntakeEntry` is append-only** — never mutated after creation. Edits happen only on `IntakeItem`.
- **`dto/`** is the wire boundary — `AiResponseDto` is mapped to domain types in `logic/parser.ts`, never used beyond that layer.
- **Dynamic route params in Next.js 16 are async** — always type as `Promise<{ id: string }>` and await in an async page component.

## Environment variables

```bash
DATABASE_URL=file:local.db        # dev default — no config needed
DATABASE_URL=libsql://...         # Turso prod URL
TURSO_AUTH_TOKEN=...              # Turso auth token (prod only)
```

## Constraints

- No authentication (yet — keep things separated so it's easy to add later)
- Image input deferred until text-only version is solid
- No ORM
- No design system — UI is minimal and functional
- No new libraries without clear justification
- No premature optimization
- Do not expand scope beyond what is explicitly requested
