#!/usr/bin/env bash
set -euo pipefail

echo "==> git status"
git status

echo "==> git diff"
git diff

echo "==> git diff --staged"
git diff --staged

echo "==> checking tracked env files"
if git ls-files | grep -E '(^|/)\.env(\..+)?$' | grep -vE '(^|/)\.env\.example$'; then
  echo "ERROR: Tracked env files detected."
  exit 1
fi
echo "OK: no tracked env files."

echo "==> running secret checks"
bash ./scripts/check-no-secrets.sh

echo "==> verifying .env.example has no assigned sensitive values"
if grep -nE '^(DATABASE_URL|ENCRYPTION_KEY|GOOGLE_OAUTH_CLIENT_ID|GOOGLE_OAUTH_CLIENT_SECRET|AUTH_SECRET|NOTION_OAUTH_CLIENT_ID|NOTION_OAUTH_CLIENT_SECRET|AI_PROVIDER_KEY|RATE_LIMIT_REDIS_URL|SUPABASE_PROJECT_URL|SUPABASE_SERVICE_ROLE_KEY)=.+' .env.example; then
  echo "ERROR: .env.example contains sensitive values."
  exit 1
fi

echo "OK: pre-push verification passed."
