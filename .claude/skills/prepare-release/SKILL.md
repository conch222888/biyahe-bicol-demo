---
name: prepare-release
description: Prepare a release candidate for founder approval - verify CI on the exact commit, summarise changes and migrations, and write the rollback plan. Does not deploy.
argument-hint: "[commit SHA or tag, default: head of default branch]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git log *), Bash(git diff *), Bash(git rev-parse *), Bash(git tag --list *), Bash(gh run list *), Bash(gh run view *), Bash(gh pr list *), Bash(gh release view *)
---
Release candidate: $ARGUMENTS (default: head of the default branch).

1. Resolve the full commit SHA. Find the previous release (latest tag or `gh release view`).
2. Verify CI passed on that exact SHA: `gh run list --commit <sha>`. If any required check is missing or failed, stop: the release is not ready.
3. List changes since the previous release from merged PRs. Flag every PR that touched schema or migrations, auth, payments or financing, infrastructure, or dependencies.
4. For each migration: is it backward compatible with the currently deployed code, and what is the recovery path?
5. Confirm staging runs this SHA and its smoke test passed, from real evidence (workflow run link). If staging does not exist or was not verified, say so.
6. Write the release note: SHA, changes, migrations, risks, the rollback command from `docs/DEPLOYMENT.md`, and the health checks to watch.
7. Stop. Tell the founder how to start the production workflow themselves. You must not trigger a production deployment, create the release tag, or approve anything. Approval of this note is not approval to deploy unless the founder says so explicitly.
