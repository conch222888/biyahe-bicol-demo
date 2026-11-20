---
name: security-audit
description: Run a scoped security audit of this repository using automated scanners plus the security-reviewer agent, and write a findings report without exposing secret values.
argument-hint: "[scope: path or area, default: whole repo]"
disable-model-invocation: true
context: fork
agent: security-reviewer
---
Audit scope: $ARGUMENTS (default: whole repository).

1. Run the automated checks that are configured: `./scripts/check.sh security`. Also run, if installed, the ecosystem audit (`pip-audit`, `npm audit --omit=dev`) and a secret scan (`gitleaks detect --redact`). Record which tools ran and which were unavailable.
2. Review by hand, in this order, stopping at the scope given: authentication and session handling; authorisation and tenant isolation on every route; payment, financing and ledger-like writes; webhooks; file uploads and document storage; places where user content reaches an AI model; logging of personal data; CI and deploy configuration.
3. Do not open `.env` files or secret stores. For any secret found in tracked files, report path, line and type only, never the value, and mark it "rotate".
4. Output a report: tools run with real results; findings by severity with file:line, exploit scenario and fix; areas not reviewed. Return it in the conversation. Write it to a file only if asked, and never into a public repository.

CRITICAL and HIGH findings must be raised to the founder immediately; they block releases until fixed or explicitly accepted in writing.
