# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` runs the server with `tsx watch` (port 5000, override with `PORT`).
- `npm run build` compiles `src/` to `dist/` with `tsc`; `npm start` runs `dist/server.js`.
- `npm run typecheck` is the only automated check. There are no tests; `npm test` is the npm placeholder and always fails.
- `GEMINI_API_KEY` must be in `.env`, otherwise the server exits on startup.
- The frontend (`public/`) is plain HTML/CSS/JS with no build step; Express serves it statically.

Real Gemini calls cost money (about 4 TL per recommendation). To test the endpoint, the rate limiter or the UI, stub Gemini (for example with `node -r` and a preload script that replaces `@google/genai`) instead of calling it.

## Architecture

One Express app in `src/server.ts` serves `public/` plus two routes: `GET /api/products` and `POST /api/recommend-pc`. There is no database; the catalog (`src/products.ts`) and the price cache live in memory.

`/api/recommend-pc` is a two-stage Gemini flow:
1. **Selection:** the compacted catalog (without `stock`) plus the rules in the system prompt go to Gemini, which returns product IDs as JSON. IDs not in the catalog are dropped and duplicates collapsed. Products with `stock: 0` are hidden from the model.
2. **Live prices:** only the chosen products are searched with Google Search grounding. A price is accepted only if its source is a real grounding result (`isSearchSource`) and is at least `MIN_PRICE_RATIO` (0.5) of the catalog price. There is deliberately **no upper bound**, because real memory and SSD prices rose several times over the catalog values. Accepted prices are cached for 24 hours. Rejected or missing ones get one retry, then fall back to the catalog price. The response total is computed on the server from these prices, never taken from the model.

Things that span files and are easy to break:
- **Thinking level:** `ThinkingLevel.LOW` is used only for the price search. On the recommendation call it caused budget overruns, so that call keeps the default.
- **Rate limits (`src/rateLimit.ts`):** per-IP per-minute, per-IP per-day and global per-day counters, all configurable by env vars (see README). The limiter validates the prompt before counting, so invalid requests don't consume quota. `trust proxy` is `3` because production traffic goes Cloudflare, then Render's internal network, then the server; changing it breaks per-IP limits.
- **Catalog and prompt rules:** compatibility rules (sockets, DDR type, PSU wattage, cooler tier) exist only as text in the system prompt in `server.ts`; the server does not validate them. CPUs with `specs.integrated_graphics` (ids 73, 74) may be sold without a GPU. The same flag is read in `public/script.js` (`renderProducts`) to decide whether a build counts as complete and shows its total, so keep both places in sync.
- **Frontend and catalog:** `public/script.js` loads `/api/products` once and reloads it if a recommendation contains an unknown ID (stale page after a catalog update). Cart, login and order history are demo-only and live in `localStorage`, with plaintext passwords and no real payment.
- **Language:** user-facing strings and code comments are Turkish. Keep that when editing.
- **Deployment:** Render builds with `npm install && npm run build` and starts with `npm start`; `dist/` is gitignored.

## Repository notes

- `docs/` holds the thesis and the design-patterns proposal PDF. It is intentionally untracked and must never be committed or pushed.
- The project is also a design-patterns course project. The planned GoF refactor (Abstract Factory, Builder, Adapter, Decorator, Chain of Responsibility, Strategy) is described in `docs/proje-onerisi.pdf` and is not implemented yet.
