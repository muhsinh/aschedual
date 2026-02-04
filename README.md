# Aschedual

Premium-feeling personal productivity capture + scheduling system.

**Core behavior**
- Chrome Extension (MV3) is the primary capture + approve interface.
- Web app handles onboarding, settings, destinations, billing, and history.
- Google Sign‑In is the only required account system.
- Google Calendar is the scheduling source of truth.
- Notion is optional and can be connected later.
- Scheduling is propose‑and‑approve only (no auto placement without explicit approval).
- Privacy-first capture: selected text + minimal snippet only (context opt‑in per save).

---

## Workspace
Monorepo (pnpm workspaces):

- `apps/web` — Next.js App Router web app (Auth, settings, billing, destinations)
- `apps/extension` — Chrome MV3 extension (capture + approve UI)
- `packages/ui` — shared UI + theme tokens
- `packages/shared` — shared types, zod schemas, constants
- `packages/scheduler` — pure scheduling engine + tests

---

## Requirements
- Node.js 20+ (tested with 22)
- pnpm 10+
- Postgres (Supabase recommended)
- Google OAuth credentials (Calendar API enabled)
- Optional: Notion OAuth app
- Optional: Stripe keys for billing

---

## Quick start
```bash
pnpm install
cp .env.example .env
```

### 1) Configure environment variables
Fill in `.env` (all values are server-only unless noted):

**Core**
- `DATABASE_URL` — Postgres connection string (Supabase recommended)
- `ENCRYPTION_KEY` — base64 32 bytes (AES‑256‑GCM)
- `AUTH_SECRET` — Auth.js secret
- `AUTH_URL` — `http://localhost:3000`

**Google OAuth**
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

**AI Provider**
- `AI_PROVIDER` — default `openai`
- `AI_PROVIDER_KEY` — OpenAI key

**Stripe (optional)**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_POWER`

**Notion (optional)**
- `NOTION_OAUTH_CLIENT_ID`
- `NOTION_OAUTH_CLIENT_SECRET`

**Rate limiting (optional)**
- `RATE_LIMIT_REDIS_URL` — Upstash (in-memory fallback for dev)

**Supabase (optional)**
- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2) Database
```bash
pnpm -C apps/web db:generate
pnpm -C apps/web db:migrate
```

### 3) Run dev servers
```bash
pnpm dev:web
pnpm dev:ext
```

Web app runs at `http://localhost:3000`.

---

## Chrome Extension (MV3)
### Load unpacked extension
1. Build or run dev: `pnpm dev:ext`
2. Go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select `apps/extension`

### Connect extension to account
1. In popup, click **Connect extension**
2. A tab opens at `/extension/connect`
3. Token is passed to the extension and stored in `chrome.storage.local`

---

## Google OAuth scopes (minimum set)
Configured in Auth.js with:
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/calendar.readonly`

This combination supports free/busy lookup and event creation without full calendar access.

Auth.js config includes:
- `access_type=offline`
- `prompt=consent`

---

## Privacy model
Default capture **only sends**:
- `url`
- `title`
- `selected_text` (if any)

Optional per‑save:
- `context_snippet` (first ~2000 chars of text) only when user checks **Expand context**

The system **never** sends full HTML by default.

---

## API overview (web app)
Routes implemented in `apps/web/app/api`:

- `POST /api/parse`
  - Server‑side AI call, strict zod validation
  - On schema failure: one retry with stricter JSON‑only prompt
- `POST /api/schedule/suggest`
  - Uses calendar timezone + free/busy to propose blocks
- `POST /api/schedule/approve`
  - Creates calendar events (if approved)
  - Optional deadline event toggle
  - Atomic usage counter increment
- `GET /api/destinations`
  - Lists calendars + Notion DBs
- `POST /api/calendars/default`
  - Sets default calendar
- `POST /api/extension/token`
  - Issues one‑time extension token (user‑scoped)
- Stripe:
  - `POST /api/stripe/checkout`
  - `POST /api/stripe/portal`
  - `POST /api/stripe/webhook`
- Notion:
  - `GET /api/notion/connect`
  - `GET /api/notion/callback`

---

## Scheduling engine (MVP rules)
Implemented in `packages/scheduler`:

- **Opportunity**
  - Schedule between now and `(deadline - bufferDays)`
  - Front‑load earlier blocks if available
- **Paper**
  - Schedule within the next 7–14 days based on preferences
- **Outreach**
  - 20–45 min block + optional follow‑up in 3–7 days
- **Constraints**
  - Working hours by day
  - Max blocks/day
  - “No scheduling after X pm”
  - Block size + effort estimates

Output labels:
```
Work: {Short Title} (Block i/n)
```

---

## Parsing output schema
Strict JSON schema in `packages/shared`:

```json
{
  "type": "paper|opportunity|outreach",
  "title": "string",
  "url": "string",
  "deadline": "ISO8601 | null",
  "deadline_tz": "IANA | null",
  "deadline_raw": "string | null",
  "confidence": { "type": 0-1, "deadline": 0-1, "requirements": 0-1, "effort": 0-1 },
  "requirements": ["string"],
  "deliverables": ["string"],
  "suggested_effort_minutes": "number | null",
  "suggested_block_minutes": "number | null",
  "summary": "string (<= 400 chars)",
  "notes": ["string"]
}
```

---

## Notion (MVP mapping)
To avoid schema‑mismatch failures:

- Required mapping: **Title + URL**
- If Type/Deadline/Status/Summary properties aren’t mapped:
  - They go into the page body instead
- “Recommended template” button is reserved for a later iteration

---

## Entitlements (plans)
Server‑side enforcement only. Never trust client.

**FREE**
- max_calendars = 1
- max_notion_workspaces = 1
- max_notion_dbs = 1
- saves_per_month = 30

**PRO**
- max_calendars = 3
- max_notion_workspaces = 1
- max_notion_dbs = 3
- saves_per_month = unlimited

**POWER**
- max_calendars = 10
- max_notion_workspaces = 3
- max_notion_dbs = 10
- saves_per_month = unlimited

---

## Usage counting (free tier)
Uses `usage_monthly (user_id, yyyymm, saves_count)`:
- Incremented in the same transaction as `items` insert
- Checked on approve/save to enforce free‑tier 30 saves/month

---

## Development notes
### Google Calendar timezones
Calendar timezone is stored per calendar (`calendars.time_zone`) to avoid off‑by‑hours scheduling.

### Deadline events
Deadline event creation is optional and user‑controlled:
- Default **ON** for opportunities
- Default **OFF** for paper/outreach

### Tokens & encryption
OAuth refresh/access tokens are encrypted at rest using AES‑256‑GCM (`ENCRYPTION_KEY`).

---

## Testing
Scheduler unit tests in `packages/scheduler/test`.

Run:
```bash
pnpm -C packages/scheduler test
```

---

## Troubleshooting
**No refresh token from Google**
- Ensure `access_type=offline` + `prompt=consent`
- Ensure the OAuth consent screen is in testing/production mode

**Free/busy returns empty**
- Confirm scopes include both `calendar.events` and `calendar.readonly`
- Confirm calendar ID is correct

**Extension can’t connect**
- Verify `http://localhost:3000` is running
- Ensure extension was loaded from `apps/extension`
- Re‑connect if token expired

---

## License
TBD
