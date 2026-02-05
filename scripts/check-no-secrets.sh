#!/usr/bin/env bash
set -euo pipefail

# Block tracked env files, but allow env templates.
blocked=$(
  git ls-files \
    | grep -E '(^|/)\.env(\..+)?$' \
    | grep -vE '(^|/)\.env\.example$' \
    || true
)
if [ -n "$blocked" ]; then
  echo "ERROR: Tracked env files detected:"
  echo "$blocked"
  exit 1
fi

# Block obvious secret assignments in tracked files.
if git grep -nE '(OPENAI|SUPABASE|NOTION|GOOGLE).*(SECRET|KEY|TOKEN)=\S+' -- . ':!**/.env.example' >/dev/null 2>&1; then
  echo "ERROR: Looks like a secret value is committed somewhere."
  echo "Search for KEY/SECRET/TOKEN assignments and remove real values."
  exit 1
fi

echo "OK: no tracked env files / obvious secret assignments."
