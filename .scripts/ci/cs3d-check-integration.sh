#!/usr/bin/env bash
# CS3D integration check: resolves whether to run CS3D integration and which ref.
# Writes to GITHUB_OUTPUT: enabled (true|false), cs3d_ref (when enabled).
#
# Canonical ref source: the committed .cs3d-ref file at the repo root (the first
# uncommented, non-blank line). This is the same file CircleCI and Netlify read via
# setup-cs3d.sh, so one file drives every CI system. Comment the line out to disable.
#
# Resolution order (highest priority first):
#   1. workflow_dispatch `cs3d_ref` input (manual run)
#   2. .cs3d-ref file (canonical committed source)
#   3. ohif-integration label + PR-body `CS3D_REF:` line (legacy fallback)
#
# Required env: GH_TOKEN, EVENT_NAME, REPO, PR_NUMBER, GITHUB_OUTPUT
# Optional env: CS3D_REF_INPUT (for workflow_dispatch, default 4.19+)

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# First active (non-comment, non-blank) line of .cs3d-ref, or empty.
read_cs3d_ref_file() {
  [[ -f "$ROOT/.cs3d-ref" ]] || return 0
  grep -vE '^[[:space:]]*(#|$)' "$ROOT/.cs3d-ref" | head -1 | tr -d '[:space:]' || true
}

emit_enabled() {
  echo "enabled=true" >> "$GITHUB_OUTPUT"
  echo "cs3d_ref=$1" >> "$GITHUB_OUTPUT"
}

# 1. workflow_dispatch input override
if [[ "$EVENT_NAME" == "workflow_dispatch" ]]; then
  echo "::notice::CS3D ref from workflow_dispatch input: ${CS3D_REF_INPUT:-4.19+}"
  emit_enabled "${CS3D_REF_INPUT:-4.19+}"
  exit 0
fi

# 2. canonical .cs3d-ref file
FILE_REF="$(read_cs3d_ref_file)"
if [[ -n "$FILE_REF" ]]; then
  echo "::notice::CS3D ref from .cs3d-ref: ${FILE_REF}"
  emit_enabled "$FILE_REF"
  exit 0
fi

# 3. legacy fallback: ohif-integration label + PR-body CS3D_REF: line
if [[ "$EVENT_NAME" == "pull_request" ]]; then
  LABELS=$(gh api "repos/${REPO}/issues/${PR_NUMBER}/labels" --jq '.[].name')
  if echo "$LABELS" | grep -q "ohif-integration"; then
    REF=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq '.body' \
      | sed -n 's/^[[:space:]]*CS3D_REF:[[:space:]]*\([^[:space:]]*\).*/\1/p' | head -1)
    if [[ -z "$REF" ]]; then
      REF="4.19+"
    fi
    echo "::notice::CS3D ref from PR body (ohif-integration label): ${REF}"
    emit_enabled "$REF"
    exit 0
  fi
fi

echo "enabled=false" >> "$GITHUB_OUTPUT"
