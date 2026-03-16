#!/usr/bin/env bash
# CS3D branch merge guard: blocks merge when tests ran against a CS3D branch (not a version).
# Exits 0 when merge is allowed or guard is skipped; exits 1 when merge must be blocked.
#
# Required env: GH_TOKEN, EVENT_NAME, REPO, PR_NUMBER
# Optional env: CS3D_REF_INPUT (for workflow_dispatch, default 4.19+)

set -e

if [[ "$EVENT_NAME" == "workflow_dispatch" ]]; then
  ENABLED=true
  CS3D_REF="${CS3D_REF_INPUT:-4.19+}"
elif [[ "$EVENT_NAME" == "pull_request" ]]; then
  LABELS=$(gh api "repos/${REPO}/issues/${PR_NUMBER}/labels" --jq '.[].name' 2>/dev/null || true)
  if echo "$LABELS" | grep -q "ohif-integration"; then
    ENABLED=true
    CS3D_REF=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq '.body' 2>/dev/null \
      | sed -n 's/^[[:space:]]*CS3D_REF:[[:space:]]*\([^[:space:]]*\).*/\1/p' | head -1)
    if [[ -z "$CS3D_REF" ]]; then
      CS3D_REF="4.19+"
    fi
  else
    ENABLED=false
  fi
else
  ENABLED=false
fi

if [[ "$ENABLED" != "true" ]]; then
  echo "::notice::No ohif-integration label — skipping merge guard."
  exit 0
fi

# Check if the ref is a branch (not a version)
if [[ "$CS3D_REF" =~ ^[0-9]+\.[0-9x]+\+?(\.[0-9x]+)?(-[a-zA-Z0-9._]+)?$ ]]; then
  echo "::notice::CS3D ref '$CS3D_REF' is a version — merge allowed."
  exit 0
fi

echo "::error::Tests ran against CS3D branch '${CS3D_REF}' — this build cannot be merged."
echo "::error::Re-run with a published CS3D version (e.g. 4.19+) before merging."
exit 1
