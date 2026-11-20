---
name: fix-bug
description: Reproduce a reported bug with a failing test, fix it with the smallest change, verify no regression, and open a pull request.
argument-hint: "<issue number or bug description>"
disable-model-invocation: true
---
Fix: $ARGUMENTS

1. Read the report (`gh issue view` if it is an issue). State expected versus actual behaviour.
2. Locate the cause. Cite the file and line. If you cannot reproduce it, say so and stop with what you tried; do not guess-fix.
3. Write a test that fails because of the bug. Run it and confirm it fails for the right reason. If a test is not practical, explain why in the PR.
4. Make the smallest fix on a `fix/…` branch. No unrelated changes.
5. Run the new test, then `./scripts/check.sh`. Both must pass.
6. If the bug involved money, bookings, permissions or personal data, run the `security-reviewer` or `database-reviewer` agent on the diff and check whether existing data was affected; if it may have been, flag that for the founder and do not attempt a data repair yourself.
7. Open a draft PR using the template, including the failing-then-passing test output. Stop; do not merge or deploy.
