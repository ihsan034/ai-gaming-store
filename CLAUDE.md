# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` runs the server with `tsx watch` (port 5000, override with `PORT`).
- `npm run build` compiles `src/` to `dist/` with `tsc`; `npm start` runs `dist/server.js`.
- `npm test` runs all tests (`node:test` through `tsx`); one file: `npx tsx --test test/pricing.test.ts`.
- `npm run typecheck` checks both `src/` and `test/` (`tsconfig.test.json`).
- With `AI_PROVIDER=gemini` (default) `GEMINI_API_KEY` must be in `.env`, otherwise the server exits on startup. `AI_PROVIDER=mock` runs the whole app with a fake provider: no key, no cost.
- The frontend (`public/`) is plain HTML/CSS/JS with no build step; Express serves it statically.

Real Gemini calls cost money (about 4 TL per recommendation). Tests never call Gemini; use `AI_PROVIDER=mock`, `MockProviderFactory` or `MockLLMClient` instead of real calls. Only the Gemini adapter itself has never been tested against the real SDK, so check it manually with one real request after changing it.

## Architecture

`src/server.ts` only reads the environment and starts the app. `src/composition.ts` is the single place where everything is wired together. `src/app.ts` (`createApp`) holds the Express routes: `GET /api/products` and `POST /api/recommend-pc`, plus static `public/`. There is no database; the catalog (`src/products.ts`) and the price cache live in memory.

The six GoF patterns from the design-patterns course are implemented, one folder each (see `TASARIM-KALIPLARI.md` for diagrams; roles are marked with `[Kalıp: ...]` comments):
- `src/ai/`: **Adapter** (`LLMClient` interface, `GeminiClientAdapter`), **Decorator** (`RetryingLLMClient`, `LoggingLLMClient`) and **Abstract Factory** (`AIProviderFactory` with `GeminiProviderFactory` and `MockProviderFactory`; each creates a recommendation client and a price-search client as a family).
- `src/pricing/`: **Strategy** (`PricingStrategy`: `CatalogPricing`, `LivePricing`), chosen by `PRICING_MODE`.
- `src/builder/`: **Builder** (`PCBuildBuilder`, `FullSystemDirector`, `PartsOnlyDirector`, immutable `PCBuild`).
- `src/validation/`: **Chain of Responsibility** (`CompatibilityRule` and one class per rule, chained in `createValidationChain.ts`).

`RecommendationService.recommend()` runs the two-stage flow:
1. **Selection:** the compacted catalog (without `stock`) plus the rules in the system prompt (`src/prompt.ts`) go to Gemini, which returns product IDs and `budget_tl` as JSON. IDs not in the catalog are dropped and duplicates collapsed. Products with `stock: 0` are hidden from the model.
2. **Prices, build, validation:** the `PricingStrategy` prices only the chosen products, a Director builds the `PCBuild`, and the validation chain reports violations. The response carries `is_full_system`, `missing_categories` and `warnings`; violations are reported, not auto-fixed. The total is computed on the server, never taken from the model.

`LivePricing` accepts a price only if its source is a real grounding result (`isSearchSource`) and it is at least `MIN_PRICE_RATIO` (0.5) of the catalog price. There is deliberately **no upper bound**, because real memory and SSD prices rose several times over the catalog values. Accepted prices are cached for 24 hours. Rejected or missing ones get one retry, then fall back to `CatalogPricing`.

Things that span files and are easy to break:
- **Thinking level:** `ThinkingLevel.LOW` is set only on the price-search client in `GeminiProviderFactory`. On the recommendation call it caused budget overruns, so that client keeps the default.
- **Rate limits (`src/rateLimit.ts`):** per-IP per-minute, per-IP per-day and global per-day counters, all configurable by env vars (see `KURULUM.md`). The limiter validates the prompt before counting, so invalid requests don't consume quota. `trust proxy` (set in `app.ts`) is `3` because production traffic goes Cloudflare, then Render's internal network, then the server; changing it breaks per-IP limits. The counters are module-level state, so tests pass their own `limiter` to `createApp`.
- **Rules live in two places:** compatibility rules exist as text in the system prompt (`prompt.ts`) and as code in `src/validation/`; change both together. CPUs with `specs.integrated_graphics` (ids 73, 74) may be sold without a GPU: the prompt allows it and `PCBuildBuilder` honors it. The frontend no longer decides what a complete system is; it reads `is_full_system` from the server.
- **Frontend and catalog:** `public/script.js` loads `/api/products` once and reloads it if a recommendation contains an unknown ID (stale page after a catalog update). Cart, login and order history are demo-only and live in `localStorage`, with plaintext passwords and no real payment.
- **Language:** user-facing strings and code comments are Turkish. Keep that when editing.
- **Deployment:** Render builds with `npm install && npm run build` and starts with `npm start`; `dist/` is gitignored.

## Repository notes

- `docs/` holds the thesis and the design-patterns proposal PDF. It is intentionally untracked and must never be committed or pushed.
- The project is also a graduation project and a design-patterns course project; the course asks for patterns to be visible in the code, plus test and setup documents (`TASARIM-KALIPLARI.md`, `TEST.md`, `KURULUM.md`).
