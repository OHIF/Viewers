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
# or a line naming a published version. Exits 1 when the line names a branch.
#
# Required env: GH_TOKEN, EVENT_NAME, REPO, PR_NUMBER

set -e

if [[ "$EVENT_NAME" != "pull_request" ]]; then
  echo "::notice::${EVENT_NAME} — no merge to flag, skipping guard."
  exit 0
fi

# Same parse as the `gate` job in .github/workflows/playwright.yml, including the
# three accepted forms: <branch>, <version>, and '<branch> now <version>'. The
# two are separate on purpose — the gate must not run a script from the PR's
# checkout — so keep them in step by hand.
RAW=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq '.body' \
  | sed -n 's/^[[:space:]]*CS3D_REF:[[:space:]]*\(.*[^[:space:]]\)[[:space:]]*$/\1/p' | head -1)

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

if [[ "$CS3D_REF" =~ ^[0-9]+\.[0-9x]+\+?(\.[0-9x]+)?(-[a-zA-Z0-9._]+)?$ ]]; then
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
