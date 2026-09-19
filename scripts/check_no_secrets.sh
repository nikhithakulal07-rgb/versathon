#!/usr/bin/env bash
# ==============================================================================
# LearnQuest - Secret Leaks & Key Safety Verification Script
# ==============================================================================
# Scans frontend source and distribution bundles to ensure NO API keys or secrets
# leaked to the client bundle or git-tracked repository files.
# ==============================================================================

set -euo pipefail

echo "🔍 Starting Secret Leak & Key Safety Scan for LearnQuest..."

FAIL=0

# 1. Check if backend/.env is accidentally tracked by git
if git ls-files --error-unmatch backend/.env 2>/dev/null; then
  echo "❌ CRITICAL: backend/.env is tracked in git! Remove it immediately from git index."
  FAIL=1
else
  echo "✅ backend/.env is properly ignored by git."
fi

# 2. Check if .env.example contains any non-empty secrets
if grep -E 'AI_API_KEY=.+' backend/.env.example 2>/dev/null; then
  echo "❌ backend/.env.example contains non-empty AI_API_KEY!"
  FAIL=1
else
  echo "✅ backend/.env.example has empty secret templates."
fi

# 3. Check for common key patterns in frontend src/ and dist/
PATTERNS=('AIza[0-9A-Za-z_-]{35}' 'sk-[0-9A-Za-z_-]{20,}' 'Bearer [0-9A-Za-z_-]{25,}')

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(grep -rEn "$pattern" frontend/src frontend/dist 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    echo "❌ CRITICAL: Found suspicious secret pattern in frontend code:"
    echo "$MATCHES"
    FAIL=1
  fi
done

if [ $FAIL -eq 0 ]; then
  echo "🎉 SUCCESS: 0 secrets or API keys found in frontend or git-tracked files."
  exit 0
else
  echo "❌ FAILED: Secrets detected. Clean them up before committing."
  exit 1
fi
