#!/usr/bin/env bash
# Single entry point for this repository's checks. CI and agents run exactly this.
# Usage: ./scripts/check.sh [all|lint|test|security|e2e]
# A stage that is not configured says so; it never prints success.
set -euo pipefail
cd "$(dirname "$0")/.."
stage="${1:-all}"

lint() { # syntax only; no linter is configured
  for f in app.js fil.js selftest.js sw.js; do node --check "$f"; done
  node --check scripts/selftest.mjs
  echo "lint: syntax ok (5 files)"
}
test_() { # the in-page self-test, headless. Needs `npm ci`, Playwright's Chromium and internet (two CDN scripts)
  node scripts/selftest.mjs
}
security() { echo "security: not configured"; }
e2e()      { test_; }

case "$stage" in
  lint) lint ;; test) test_ ;; security) security ;; e2e) e2e ;;
  all) lint; test_; security ;;
  *) echo "unknown stage: $stage" >&2; exit 64 ;;
esac
