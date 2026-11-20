---
name: incident-review
description: Investigate a failed deployment, outage, failed scheduled job or data inconsistency from real logs and history, and write a blameless incident review with follow-up actions.
argument-hint: "<what happened, with time and links if known>"
disable-model-invocation: true
---
Incident: $ARGUMENTS

1. Establish the timeline from evidence only: `gh run list` / `gh run view --log-failed`, `git log` around the time, deploy records, and logs the founder provides. Use UTC and Asia/Manila times. Mark every statement as OBSERVED (with source) or HYPOTHESIS.
2. Identify impact: who and what was affected, for how long. For anything involving payments, bookings, orders or financing records, check for duplicate or half-completed transactions and list the affected record IDs if you can see them in non-production data; never query production data yourself, ask the founder for an export with personal fields removed.
3. Identify the cause and the contributing conditions (missing test, missing alert, manual step).
4. Follow `docs/RUNBOOK.md` for the matching scenario. State whether that procedure is marked TESTED or UNTESTED.
5. Write `docs/incidents/YYYY-MM-DD-<short-name>.md`: summary, timeline, impact, cause, what went well, actions (each with an owner and a GitHub issue to create). Leave out personal data, secrets and raw financial documents.
6. Propose, do not apply, any production change. Rollbacks and data repairs are executed or approved by the founder.
