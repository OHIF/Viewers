#!/usr/bin/env bash
# CS3D integration check: detects ohif-integration label and parses CS3D_REF.
# Writes to GITHUB_OUTPUT: enabled (true|false), cs3d_ref (when enabled).
#
# Required env: GH_TOKEN, EVENT_NAME, REPO, PR_NUMBER, GITHUB_OUTPUT
# Optional env: CS3D_REF_INPUT (for workflow_dispatch, default 4.19+)

set -e

if [[ "$EVENT_NAME" == "workflow_dispatch" ]]; then
  echo "enabled=true" >> "$GITHUB_OUTPUT"
  echo "cs3d_ref=${CS3D_REF_INPUT:-4.19+}" >> "$GITHUB_OUTPUT"
elif [[ "$EVENT_NAME" == "pull_request" ]]; then
  LABELS=$(gh api "repos/${REPO}/issues/${PR_NUMBER}/labels" --jq '.[].name' 2>/dev/null || true)
  if echo "$LABELS" | grep -q "ohif-integration"; then
    echo "enabled=true" >> "$GITHUB_OUTPUT"
    REF=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq '.body' 2>/dev/null \
      | sed -n 's/^[[:space:]]*CS3D_REF:[[:space:]]*\([^[:space:]]*\).*/\1/p' | head -1)
    if [[ -z "$REF" ]]; then
      REF="4.19+"
    fi
    echo "cs3d_ref=${REF}" >> "$GITHUB_OUTPUT"
    echo "::notice::CS3D ref from PR body: ${REF}"
  else
    echo "enabled=false" >> "$GITHUB_OUTPUT"
  fi
else
  echo "enabled=false" >> "$GITHUB_OUTPUT"
fi
