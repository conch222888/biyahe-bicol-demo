# Engineering workflow

Every change follows: intake → analyse → plan → implement → test → review → repair → pull request → human approval → deploy and verify.

## Risk classes
- **LOW**: docs, copy, tests, small isolated fixes. Short plan, one review pass.
- **STANDARD**: ordinary features and bug fixes. Written plan in the PR, tests required.
- **HIGH**: schema or migrations; authentication or authorisation; payments, refunds, financing or any ledger-like record; infrastructure, CI or deploy configuration; deleting or bulk-changing data; new external services. Requires a written spec or ADR and explicit founder approval **before** implementation, plus security and/or database review before the PR is ready.

## Rules
- Work only on approved tasks. Approval of a plan or a PR is never approval to deploy.
- Feature branches only. Never commit to, push to or merge into the default or release branches. Never force-push a shared branch.
- At most two implementation tasks in parallel, and only when they touch disjoint files and no shared schema, lockfile or workflow.
- `./scripts/check.sh` must pass before a PR is marked ready. Report real output; "not run" is an acceptable answer, a false "passed" is not.
- Bug fixes carry a regression test where feasible. New features carry acceptance criteria and tests for them.
- Stop after three failed attempts at the same failure and report, rather than looping.
- Production deploys, production data, credentials and spending decisions belong to the founder.

## Definition of done
Acceptance criteria met and tested; checks green on the PR commit; required reviews done with no open critical or high finding; PR template completed truthfully; docs updated where behaviour changed.
