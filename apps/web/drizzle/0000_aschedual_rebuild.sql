DO $$ BEGIN
  CREATE TYPE integration_provider AS ENUM ('google', 'notion');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('proposed', 'approved', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notion_status AS ENUM ('skipped', 'success', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notion_target_type AS ENUM ('database', 'page');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS captures CASCADE;
DROP TABLE IF EXISTS extension_tokens CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS google_connections CASCADE;
DROP TABLE IF EXISTS calendars CASCADE;
DROP TABLE IF EXISTS notion_connections CASCADE;
DROP TABLE IF EXISTS notion_databases CASCADE;
DROP TABLE IF EXISTS entitlements CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS usage_monthly CASCADE;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_unique ON users (email);

CREATE TABLE captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL,
  selected_text text NOT NULL,
  snippet_nullable text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id uuid NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parsed_title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  location_nullable text,
  notes_nullable text,
  created_at timestamptz NOT NULL DEFAULT now(),
  status proposal_status NOT NULL DEFAULT 'proposed',
  failure_reason text,
  timezone text NOT NULL DEFAULT 'UTC'
);

CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  encrypted_access_token text NOT NULL,
  encrypted_refresh_token text,
  expires_at timestamptz,
  token_type text,
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX integrations_user_provider_unique ON integrations (user_id, provider);

CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT now(),
  gcal_event_id_nullable text,
  notion_page_id_nullable text,
  raw_response_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notion_status notion_status NOT NULL DEFAULT 'skipped',
  notion_error text
);

CREATE TABLE extension_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_calendar_id text,
  default_duration_minutes integer NOT NULL DEFAULT 45,
  notion_target_type notion_target_type,
  notion_target_id text,
  default_snippet_enabled boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_settings_user_unique ON user_settings (user_id);
