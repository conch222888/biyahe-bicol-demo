#!/usr/bin/env bash
# PreToolUse hook for the Bash tool. Blocks commands an agent session must never run:
# pushes to protected branches, force pushes, merges, deploys, secret reads, destructive
# data commands. Exit 2 blocks the call and shows stderr to the agent.
#
# This is a guard rail, not a security boundary: command-text matching can be evaded.
# The enforceable controls are GitHub branch protection, environment-scoped deploy
# credentials and the fact that agent sessions hold no production credentials.
set -u

input="$(cat)"
cmd=""
if command -v python3 >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("command", ""))
except Exception:
    pass' 2>/dev/null)"
elif command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)"
fi
# If the JSON could not be parsed, scan the raw payload (may over-block; that is the safe side).
[ -n "$cmd" ] || cmd="$input"

# Extra protected branches or deploy command patterns can be added per repo (extended regex).
PROTECTED="${GUARD_PROTECTED_BRANCHES:-main|master|production|prod|release[^[:space:]]*}"

block() {
  echo "Blocked by .claude/hooks/guard-bash.sh: $1" >&2
  echo "This action is reserved for the founder or for the reviewed GitHub workflow. Do not retry it another way; report it instead." >&2
  exit 2
}
has() { printf '%s\n' "$cmd" | grep -Eiq -- "$1"; }

# --- git: protected branches, force pushes, history rewrites on shared refs
if has '(^|[;&|[:space:]])git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+push([[:space:]]|$)'; then
  has '[[:space:]](--force|-f|--force-with-lease[^[:space:]]*|--mirror|--delete|-d)([[:space:]]|$)' && block "force, mirror or delete push"
  has "[[:space:]]\+[^[:space:]]+" && block "force push via +refspec"
  has "[[:space:]:/]($PROTECTED)([[:space:]]|$)" && block "push to a protected branch"
  has "HEAD:(refs/heads/)?($PROTECTED)([[:space:]]|$)" && block "push to a protected branch"
fi
has '(^|[;&|[:space:]])gh[[:space:]]+pr[[:space:]]+merge' && block "merging pull requests"
has '(^|[;&|[:space:]])gh[[:space:]]+(release[[:space:]]+create|secret|variable)' && block "release, secret or variable management"
has '(^|[;&|[:space:]])gh[[:space:]]+api[[:space:]].*(protection|environments|rulesets)' && block "changing repository protection settings"
has '(^|[;&|[:space:]])gh[[:space:]]+workflow[[:space:]]+run[[:space:]].*(deploy|release|prod)' && block "triggering a deploy or release workflow"

# --- deploys and infrastructure changes
has '(^|[;&|[:space:]])gcloud[[:space:]].*[[:space:]](deploy|submit)([[:space:]]|$)' && block "cloud deploy or build submit"
has '(^|[;&|[:space:]])gcloud[[:space:]]+(secrets|iam|sql)[[:space:]]' && block "cloud secrets, IAM or database administration"
has '(^|[;&|[:space:]])(firebase|fly|flyctl|railway|netlify|heroku)[[:space:]]+.*deploy' && block "platform deploy"
has '(^|[;&|[:space:]])vercel([[:space:]].*)?[[:space:]]--prod' && block "production deploy"
has '(^|[;&|[:space:]])(terraform|tofu|pulumi)[[:space:]]+(apply|destroy|up)' && block "infrastructure apply or destroy"
has '(^|[;&|[:space:]])kubectl[[:space:]]+(apply|delete|replace|patch|scale|rollout)' && block "cluster change"
has '(^|[;&|[:space:]/])deploy[^[:space:]/]*\.sh([[:space:]]|$)' && block "running a deploy script"
[ -n "${GUARD_EXTRA_BLOCK:-}" ] && has "$GUARD_EXTRA_BLOCK" && block "repo-specific blocked command"

# --- secrets
has '(^|[;&|[:space:]])(cat|less|more|head|tail|bat|grep|rg|awk|sed|cp|scp|curl|base64|xxd|strings|source|\.)([[:space:]]|[[:space:]].*[[:space:]/"'"'"'=@])\.env(\.(local|prod[a-z]*|staging|dev[a-z]*))?(["'"'"'[:space:]]|$)' && block "reading an environment/secret file"
has '(^|[;&|[:space:]])(printenv|env)([[:space:]]*$|[[:space:]]*[|>])' && block "dumping the environment"

# --- destructive
has '(^|[;&|[:space:]])rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*[[:space:]]+)+(-[a-zA-Z]+[[:space:]]+)*(/|~|\$HOME|\.\.|/\*|\.git)([[:space:]/]|$)' && block "recursive delete outside the project"
has '(drop[[:space:]]+(table|database|schema)|truncate[[:space:]]+table)[[:space:]]' && block "destructive SQL"
has '(^|[;&|[:space:]])git[[:space:]]+(clean[[:space:]]+-[a-z]*f[a-z]*d|filter-branch|filter-repo)' && block "destructive git operation"

exit 0
