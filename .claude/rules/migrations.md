---
paths:
  - "**/migrations/**"
  - "**/alembic/**"
  - "**/*.sql"
  - "**/models.py"
  - "**/models/**"
  - "**/schema.*"
  - "**/prisma/**"
---
# Schema and migration changes

- Schema changes are HIGH risk: written plan and founder approval before implementation; `database-reviewer` before the PR is ready.
- Use expand → migrate → contract. A migration must work with the code that is deployed now and the code being released.
- Every migration PR states: what changes, expected runtime and locking on current data volume, how to roll back or recover, and whether a backup was taken first.
- Destructive steps (drop, rename, type narrowing, bulk update or delete) go in a separate PR with separate explicit founder approval.
- Never run migrations against staging or production from an agent session. Test them against a local disposable database.
- Business invariants (no double booking, no duplicate payment, one active record per key) are enforced by database constraints, not only by application code.
