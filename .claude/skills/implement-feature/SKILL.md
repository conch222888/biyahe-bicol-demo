---
name: implement-feature
description: Take an approved feature request or GitHub issue from analysis through plan, implementation, tests, review and a pull request, stopping at the human approval gate.
argument-hint: "<issue number or feature description>"
disable-model-invocation: true
---
Implement: $ARGUMENTS

Follow `.claude/rules/workflow.md`. Steps, in order; do not skip one:

1. **Intake.** If the argument is an issue number, read it with `gh issue view`. Confirm it is approved by the founder (label `approved`, or a direct founder instruction in this conversation). If not, stop and ask.
2. **Analyse.** Use the built-in Explore agent to find the relevant code. Write the acceptance criteria. Classify risk LOW / STANDARD / HIGH.
3. **Plan.** LOW: three-line plan in the conversation. STANDARD: short written plan. HIGH (schema, payments, auth, financing, infrastructure, data deletion): have the `software-architect` agent write a spec or ADR, then stop and wait for founder approval before any implementation.
4. **Implement.** Delegate to the `software-developer` agent on a feature branch. One implementation task at a time unless the orchestrator has confirmed two tasks touch disjoint files.
5. **Test.** Run `./scripts/check.sh`. Have `qa-test-engineer` add tests for any acceptance criterion without one.
6. **Review.** Run the `security-reviewer` agent when the diff touches anything in its description; run `database-reviewer` when it touches schema, migrations or ledger-like writes. Otherwise a single `/review-pr` pass is enough. Do not run reviewers that the diff does not call for.
7. **Repair.** Fix findings, rerun only the affected checks, then the full `./scripts/check.sh` once.
8. **Pull request.** Push the branch and open a draft PR with `.github/pull_request_template.md` filled in from real results. Paste actual command output for tests; write "not run" where something was not run.
9. **Stop.** Report the PR link, what passed, what is unverified, and what needs the founder's decision. Do not merge. Do not deploy.
