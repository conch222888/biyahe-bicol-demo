---
name: run-tests
description: Run this repository's real checks (format, lint, types, tests, security scan) through scripts/check.sh and report the actual results.
argument-hint: "[stage: all | lint | test | security | e2e]"
allowed-tools: Read, Bash(./scripts/check.sh *), Bash(./scripts/check.sh)
---
Run: `./scripts/check.sh $ARGUMENTS`

- `scripts/check.sh` is the single entry point; CI runs the same script. If it does not exist or a stage prints "not configured", say exactly that. Do not substitute your own judgement for a missing check.
- Report per stage: command, exit code, pass/fail counts, and the failing output verbatim (trimmed to the relevant lines).
- A stage that did not run is "not run". Never summarise as "all tests pass" unless every configured stage ran and exited 0.
- Do not edit code or tests in this skill. If asked to fix failures, hand off to `/fix-bug`.
