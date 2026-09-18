#!/usr/bin/env bash
# CS3D branch merge guard: flags a pull request that depends on unreleased CS3D
# code. A `CS3D_REF:` line naming a branch means the change was validated against
# cornerstone3D that npm does not carry, so merging it would leave master
# depending on code no released version provides.
#
# ADVISORY, not enforcing. It reports; it does not block. `master` requires no
# status checks, so a non-zero exit here leaves the merge button enabled, and
# this script runs from the pull request's own checkout, so a fork could change
# it. Read a red result as "a human should look", not as a lock.
#
# It keys off the presence of the `CS3D_REF:` line itself, not off a label, and
# not off whether the integration tests were actually run — a PR that declares a
# dependency on an unreleased branch is worth flagging either way.
#
# Exits 0 when there is nothing to flag: not a pull request, no CS3D_REF line,
# or a line naming a published version. Exits 1 when the line names a branch,
# when the version after `now` is not one concrete release, or when the PR body
# cannot be read.
#
# Required env: GH_TOKEN, EVENT_NAME, REPO, PR_NUMBER

# pipefail as well as -e: the PR body arrives through `gh api`, and a pipeline
# reports only the exit status of its last command. Without it a failed API call
# leaves an empty body, which reads as "no CS3D_REF line" and passes the guard.
# The body also goes into a variable before it is parsed, because the parser
# stops at the first match and can close the pipe while `gh` is still writing.
set -eo pipefail

if [[ "$EVENT_NAME" != "pull_request" ]]; then
  echo "::notice::${EVENT_NAME} — no merge to flag, skipping guard."
  exit 0
fi

# Same parse as the `gate` job in .github/workflows/playwright.yml, including the
# three accepted forms: <branch>, <version>, and '<branch> now <version>'. The
# two are separate on purpose — the gate must not run a script from the PR's
# checkout — so keep them in step by hand.
if ! BODY=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq '.body'); then
  echo "::error::Could not read the body of pull request ${PR_NUMBER} in ${REPO}, so this guard cannot tell whether the PR depends on unreleased cornerstone3D code. Failing instead of reporting all clear."
  exit 1
fi

RAW=$(awk '
  {
    line = $0
    sub(/^[[:space:]]+/, "", line)
    ch = substr(line, 1, 1)
    n = 0
    if (ch == "`" || ch == "~") { while (substr(line, n + 1, 1) == ch) n++ }
    if (n >= 3) {
      # A closing fence repeats the opening marker, is at least as long, and
      # carries nothing else. Anything else is content: a three-backtick line
      # inside a four-backtick block must not end it.
      if (fence == "") { fence = ch; flen = n }
      else if (ch == fence && n >= flen && substr(line, n + 1) ~ /^[[:space:]]*$/) { fence = "" }
      next
    }
    if (fence == "" && line ~ /^CS3D_REF:/) {
      sub(/^CS3D_REF:[[:space:]]*/, "", line)
      sub(/[[:space:]]+$/, "", line)
      print line; exit
    }
  }' <<<"$BODY")

if [[ -z "$RAW" ]]; then
  echo "::notice::No CS3D_REF line in the pull request body — nothing to flag."
  exit 0
fi

# '<branch> now <version>' means the branch has shipped as that version, so what
# the PR depends on is the released version. Judge that, not the branch name
# kept for history.
if [[ "$RAW" =~ ^(.*[^[:space:]])[[:space:]]+now[[:space:]]+([^[:space:]]+)$ ]]; then
  CS3D_HISTORY="${BASH_REMATCH[1]}"
  CS3D_REF="${BASH_REMATCH[2]}"
else
  CS3D_HISTORY=""
  CS3D_REF="$RAW"
fi

# The version after `now` records what the branch shipped as, so it has to be
# one concrete release; a range would resolve differently on a later read.
#
# The prerelease class is the one semver allows: dot-separated identifiers of
# letters, digits and hyphens. The hyphen matters — `5.11.0-rc-1` is a legal
# release. `_` is NOT legal and is deliberately absent. The same class appears
# in the version test below and twice in the `gate` job of
# `.github/workflows/playwright.yml`; keep all four in step.
if [[ -n "$CS3D_HISTORY" ]] && [[ ! "$CS3D_REF" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "::error::CS3D_REF says branch '${CS3D_HISTORY}' was released as '${CS3D_REF}', which is not one concrete version. Write the exact release, e.g. 5.10.6."
  exit 1
fi

if [[ "$CS3D_REF" =~ ^[0-9]+\.[0-9x]+\+?(\.[0-9x]+)?(-[0-9A-Za-z.-]+)?$ ]]; then
  if [[ -n "$CS3D_HISTORY" ]]; then
    echo "::notice::CS3D ref '$CS3D_REF' is a published version (branch '$CS3D_HISTORY' shipped as it) — merge allowed."
  else
    echo "::notice::CS3D ref '$CS3D_REF' is a published version — merge allowed."
  fi
  exit 0
fi

echo "::error::This pull request declares CS3D_REF '${CS3D_REF}', a branch rather than a published version, so merging it would leave master depending on unreleased cornerstone3D code."
echo "::error::Once the cornerstone3D change is released, change the line to '${CS3D_REF} now <version>' to keep the branch name as history while depending on the release."
echo "::error::Change the CS3D_REF line to a published version (e.g. 5.x) once the cornerstone3D change has been released, or remove the line if it is stale."
exit 1
