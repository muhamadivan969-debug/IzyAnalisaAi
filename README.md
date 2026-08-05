# IzyAnalisaAi

Repository for IzyAnalisaAI — mobile-first UI for quick stock analysis using AI and scraped market data.

## Setup & Run (recommended)

1. Install Node.js (recommended: 18 or 20). Use nvm if needed:
   - nvm install 18 && nvm use 18

2. Preferred package manager (this repo includes pnpm lockfile):
   - pnpm install
   - pnpm dev

   Or using npm (less recommended):
   - npm install
   - npm run dev

3. Environment variables
   - Create a `.env.local` at the project root (do NOT commit secrets). Copy from `.env.example` and fill values.

   Required environment variables:
   - `DATABASE_URL` — Postgres connection string used by drizzle/pg (e.g. `postgres://user:pass@localhost:5432/dbname`).
   - `PARSEBOT_API_KEY` — API key for Parse Bot scraping endpoints used by `/api/saham`, `/api/summary`, `/api/sector`.
   - `GEMINI_API_KEY` — API key for the AI/chat endpoint used by `/api/chat`.

4. System dependencies (if `pg` fails to install):
   - Linux (Debian/Ubuntu): `sudo apt-get install build-essential python3 libpq-dev`
   - macOS: `xcode-select --install`

5. Port
   - Default: 3000. To run on a different port:
     - Linux/mac: `PORT=3001 pnpm dev`
     - Windows (PowerShell): `$env:PORT=3001; pnpm dev`

## Changes made automatically
- Renamed backup: created `pages/_app_deprecated.js` (contains previous JS App) so the TypeScript App at `pages/_app.tsx` can be the canonical implementation.
- Replaced `pages/_app.js` with a small proxy that forwards to `pages/_app.tsx` to avoid duplicate App definitions.
- Added `.env.example` (see below) and this README instructions.

## .env.example
See `.env.example` in repository for a template.

## Notes
- The API routes rely on external scraping services and AI keys; if these are missing you'll see clear 500 responses from the API routes stating which key is missing.
- If you prefer we can remove `pages/_app_deprecated.js` later once you're certain everything runs with the TypeScript App.
