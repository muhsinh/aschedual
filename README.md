# Aschedual

Aschedual is a privacy-first scheduling workflow for a Chrome extension + web app.

Flow:
1. Extension captures selected text, URL, and title.
2. Web API stores capture and proposes a schedule item.
3. User edits and approves in the web inbox.
4. Approval writes to Google Calendar (source of truth) and optionally Notion.

## Monorepo layout
- `apps/web` - Next.js 14 App Router app + API routes
- `apps/extension` - MV3 placeholder scaffold (manifest + docs only)
- `packages/shared` - shared Zod schemas and API payload types

## Prerequisites
- Node.js 20+
- pnpm 10+
- Supabase Postgres project (or compatible Postgres)
- Google OAuth credentials
- Notion OAuth app (optional)

## Environment setup
1. Copy template:
```bash
cp .env.example .env.local
```

2. Configure Git hooks path:
```bash
git config core.hooksPath .githooks
```

3. Fill `.env.local` values:
- `DATABASE_URL`
- `ENCRYPTION_KEY` (base64 32-byte key)
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `AUTH_SECRET`
- `AUTH_URL` (`http://localhost:3000` locally)
- `NOTION_OAUTH_CLIENT_ID` (optional)
- `NOTION_OAUTH_CLIENT_SECRET` (optional)
- `AI_PROVIDER` (`openai`)
- `AI_PROVIDER_KEY` (optional, fallback parser works without it)
- `RATE_LIMIT_REDIS_URL` (optional)
- `SUPABASE_PROJECT_URL` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` (optional)

## Supabase setup (`DATABASE_URL`)
1. Create a Supabase project.
2. Open Project Settings -> Database.
3. Copy the connection string and set `DATABASE_URL`.
4. Ensure the DB has `pgcrypto` extension enabled for `gen_random_uuid()`.

## Google OAuth setup (testing mode)
1. In Google Cloud Console, create or select a project.
2. Configure OAuth consent screen in **Testing** mode.
3. Add scopes:
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/calendar.readonly`
4. Create OAuth client credentials (Web application).
5. Add redirect URIs:
- `http://localhost:3000/api/auth/callback/google`
- `https://<your-vercel-domain>/api/auth/callback/google`
6. Set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

## Notion OAuth setup
1. Create a public integration at [Notion Developers](https://www.notion.so/profile/integrations).
2. Configure redirect URIs:
- `http://localhost:3000/api/integrations/notion/callback`
- `https://<your-vercel-domain>/api/integrations/notion/callback`
3. Configure policy URLs in Notion app settings:
- Privacy policy URL
- Terms of use URL
4. Set `NOTION_OAUTH_CLIENT_ID` and `NOTION_OAUTH_CLIENT_SECRET`.

## Database migration
```bash
pnpm db:generate
pnpm db:migrate
```

## Local development
```bash
pnpm install
pnpm dev
```

App URL: `http://localhost:3000`

## Required routes
- `POST /api/capture`
- `POST /api/propose`
- `POST /api/clip`
- `POST /api/approve`
- `GET /api/me`
- `POST /api/extension/token`
- `POST /api/integrations/google/connect`
- `POST /api/integrations/google/disconnect`
- `POST /api/integrations/notion/connect`
- `GET /api/integrations/notion/callback`
- `POST /api/integrations/notion/disconnect`
- `GET/POST /api/settings/destinations`
- `GET/POST /api/settings/privacy`
- `GET /extension/connect`
- `GET /extension/settings`

## Extension handshake contract
1. Extension opens `/extension/connect`.
2. If unauthenticated, user is redirected to sign in.
3. App issues short-lived token via `/api/extension/token`.
4. Page posts `{ source: "aschedual-extension-connect", token }` to window.
5. Extension stores token and uses Bearer auth.

Canonical extension settings URL:
- `/settings/integrations?source=extension`

## Secret-safe checks
Run before commit/push:
```bash
pnpm run check:no-secrets
pnpm run prepush:verify
```

## Vercel deployment
1. Create a new Vercel project from this repository.
2. Set **Root Directory** to `apps/web`.
3. Add all required environment variables in Vercel Project Settings.
4. Set production `AUTH_URL` to your deployed domain.
5. Redeploy after setting OAuth redirect URIs for production.
