#!/usr/bin/env bash
# CS3D branch merge guard: blocks merge when OHIF would be built against a CS3D
# *branch* (not a published version). Mirrors the ref resolution in
# cs3d-check-integration.sh so the guard and the tests agree on the ref.
#
# Canonical ref source: the committed .cs3d-ref file (first uncommented line).
# Falls back to the ohif-integration label + PR-body CS3D_REF: line.
#
# Exits 0 when merge is allowed or the guard is skipped; exits 1 when merge must
# be blocked.
#
# Required env: GH_TOKEN, EVENT_NAME, REPO, PR_NUMBER
# Optional env: CS3D_REF_INPUT (for workflow_dispatch, default 4.19+)

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ "$EVENT_NAME" == "workflow_dispatch" ]]; then
  echo "::notice::workflow_dispatch — no merge to block, skipping guard."
  exit 0
fi

# 1. canonical .cs3d-ref file (first active, non-comment, non-blank line)
CS3D_REF=""
if [[ -f "$ROOT/.cs3d-ref" ]]; then
  CS3D_REF="$(grep -vE '^[[:space:]]*(#|$)' "$ROOT/.cs3d-ref" | head -1 | tr -d '[:space:]' || true)"
fi

# 2. legacy fallback: ohif-integration label + PR-body CS3D_REF: line
if [[ -z "$CS3D_REF" && "$EVENT_NAME" == "pull_request" ]]; then
  LABELS=$(gh api "repos/${REPO}/issues/${PR_NUMBER}/labels" --jq '.[].name')
  if echo "$LABELS" | grep -q "ohif-integration"; then
    CS3D_REF=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq '.body' \
      | sed -n 's/^[[:space:]]*CS3D_REF:[[:space:]]*\([^[:space:]]*\).*/\1/p' | head -1)
    if [[ -z "$CS3D_REF" ]]; then
      CS3D_REF="4.19+"
    fi
  fi
fi

if [[ -z "$CS3D_REF" ]]; then
  echo "::notice::No active .cs3d-ref and no ohif-integration label — skipping merge guard."
  exit 0
fi

# Versions are published + reproducible -> allowed. Branches -> blocked.
if [[ "$CS3D_REF" =~ ^[0-9]+\.[0-9x]+\+?(\.[0-9x]+)?(-[a-zA-Z0-9._]+)?$ ]]; then
  echo "::notice::CS3D ref '$CS3D_REF' is a version — merge allowed."
  exit 0
fi

echo "::error::OHIF is set to build against CS3D branch '${CS3D_REF}' — this build cannot be merged."
echo "::error::Comment out the line in .cs3d-ref (or set a published version, e.g. 4.19+) before merging."
exit 1
