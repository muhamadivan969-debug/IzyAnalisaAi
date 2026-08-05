# IzyAnalisaAi

Mobile-first UI for quick stock analysis using AI and scraped market data.

## Setup & Run (recommended)

1. Install Node.js (recommended: 18).

2. Preferred package manager (this repo includes pnpm lockfile):
   - pnpm install
   - pnpm dev

   Or using npm:
   - npm install
   - npm run dev

3. Environment variables
   - Create a `.env.local` at the project root (do NOT commit secrets). Copy from `.env.example` and fill values.

   Optional environment variables:
   - `PARSE_API_KEY` — API key for Parse.bot scraping endpoints used by `/api/saham`, `/api/summary`, `/api/sector`.
   - `OPENAI_API_KEY` — API key for OpenAI (used by `/api/chat` if provided).

4. Port
   - Default: 3000. To run on a different port:
     - Linux/mac: `PORT=3001 pnpm dev`
     - Windows (PowerShell): `$env:PORT=3001; pnpm dev`

## Notes
- The API routes rely on external scraping services (Parse.bot) and AI keys; if these are missing you'll see mock responses from the API routes stating which key is missing.
- For development the app falls back to mock data so UI can be tested without keys.
