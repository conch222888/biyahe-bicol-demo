---
name: review-pr
description: Review a pull request or the current branch diff for correctness, security, data integrity and conformity with project rules, and report findings.
argument-hint: "[PR number, default: current branch]"
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git log *), Bash(git status *), Bash(gh pr view *), Bash(gh pr diff *), Bash(gh pr checks *)
---
Review target: $ARGUMENTS (if empty, the current branch against the default branch).

1. Get the diff: `gh pr diff <n>` or `git diff origin/HEAD...HEAD`. Read the changed files in full where the diff alone is ambiguous.
2. Get deterministic results first: `gh pr checks <n>`. Do not re-judge what CI already decides (formatting, lint, types, tests); report failing checks and move on.
3. Review for: logic errors and unhandled cases; missing tests for new behaviour; violations of `CLAUDE.md` and `.claude/rules/`; auth and tenant checks on new endpoints; duplicate-transaction and concurrency risks on writes; secrets or personal data in code, logs or fixtures; migrations without a compatibility and rollback note.
4. If the diff touches areas in the `security-reviewer` or `database-reviewer` descriptions, delegate that part to the agent once. Do not run a reviewer twice on an unchanged diff.
5. Report findings ordered by severity, each with file:line, the concrete failure scenario and a suggested fix. Then one verdict: BLOCK (critical or high finding, or failing required check), CHANGES REQUESTED, or OK FOR HUMAN REVIEW.

You never approve or merge a PR. Post the review as a PR comment only if asked.
