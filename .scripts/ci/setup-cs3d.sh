#!/usr/bin/env bash
# Portable CS3D integration setup — no GitHub token required.
#
# Resolves which Cornerstone3D to build OHIF against from, in priority:
#   1. $CS3D_REF environment variable (explicit override)
#   2. the committed .cs3d-ref file at the repo root
#   3. nothing -> leave the published @cornerstonejs/* from the lockfile in place
#
# A ref that looks like a version (e.g. 5.0.2, 4.19+, 4.x, 4.19.0-beta.1) takes
# the "version" path; anything else is treated as a CS3D branch ("branch" path,
# optionally "owner:branch" to pull from a fork).
#
#   branch  -> clone + install + build:esm into libs/@cornerstonejs, then symlink
#              the built packages into OHIF's node_modules
#   version -> rewrite @cornerstonejs/* versions across the workspace + reinstall
#
# Intended to run AFTER OHIF's own `pnpm install` (the branch build is independent
# of OHIF's dependency install; the link/reinstall steps assume node_modules exist).
#
# This mirrors what .github/workflows/playwright.yml does inline, but works in any
# CI (CircleCI, Netlify) because it never calls `gh` or reads $GITHUB_OUTPUT.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

log() { echo "[cs3d] $*"; }

# ── 1. Resolve the ref ───────────────────────────────────────────────────────
REF="${CS3D_REF:-}"
if [[ -z "$REF" && -f "$ROOT/.cs3d-ref" ]]; then
  REF="$(grep -vE '^[[:space:]]*(#|$)' "$ROOT/.cs3d-ref" | head -1 | tr -d '[:space:]' || true)"
fi

if [[ -z "$REF" ]]; then
  log "no ref configured (no \$CS3D_REF and no .cs3d-ref) — using published @cornerstonejs/* from the lockfile"
  exit 0
fi

# ── 2. Classify: version vs branch (same pattern as the Playwright workflow) ──
if [[ "$REF" =~ ^[0-9]+\.[0-9x]+\+?(\.[0-9x]+)?(-[a-zA-Z0-9._]+)?$ ]]; then
  TYPE=version
else
  TYPE=branch
fi
log "ref=$REF type=$TYPE"

# ── 2.5. Protected-branch guard ───────────────────────────────────────────────
# A CS3D *branch* ref must never be consumed on a protected branch (master,
# release/*): it would build/test against an unpublished, mutable CS3D branch.
# A committed .cs3d-ref is meant to be reset to a published version (or removed)
# before merging, but that is a manual step that is easy to forget. This mirrors
# cs3d-branch-merge-guard.sh in the Playwright workflow (which blocks merging PRs
# that tested against a branch ref); fail fast here so master/release CI can't
# silently follow a forgotten branch ref. Version refs are published + reproducible
# and remain allowed, matching the merge guard's policy.
BRANCH_NAME="${CIRCLE_BRANCH:-${GITHUB_REF_NAME:-${BRANCH:-}}}"
if [[ "$TYPE" == "branch" && ( "$BRANCH_NAME" == "master" || "$BRANCH_NAME" == release/* ) ]]; then
  log "ERROR: refusing to consume CS3D branch ref '$REF' on protected branch '$BRANCH_NAME'."
  log "Reset .cs3d-ref to a published version (e.g. 4.19+) or remove the file before merging."
  exit 1
fi

# ── 3. Apply ─────────────────────────────────────────────────────────────────
if [[ "$TYPE" == "version" ]]; then
  log "pinning @cornerstonejs/* to $REF and reinstalling"
  node .scripts/cs3d-set-version.mjs "$REF"
  pnpm install --no-frozen-lockfile
  log "done (version $REF)"
  exit 0
fi

# branch path
if [[ "$REF" == *:* ]]; then
  REPO="https://github.com/${REF%%:*}/cornerstone3D.git"
  BRANCH="${REF#*:}"
else
  REPO="https://github.com/cornerstonejs/cornerstone3D.git"
  BRANCH="$REF"
fi

# Never delete an existing checkout (e.g. a local git worktree at libs/@cornerstonejs).
# On CI the dir is absent (libs/ is gitignored) so we clone; locally we build in place.
if [[ -e libs/@cornerstonejs/.git ]]; then
  log "libs/@cornerstonejs already present — building in place (skipping clone)"
else
  log "cloning $REPO @ $BRANCH"
  git clone --depth 1 --branch "$BRANCH" "$REPO" libs/@cornerstonejs
fi

log "installing + building CS3D (build:esm)"
( cd libs/@cornerstonejs && pnpm install --frozen-lockfile && pnpm run build:esm )

log "linking built @cornerstonejs/* packages into OHIF node_modules"
node libs/@cornerstonejs/scripts/link-ohif-cornerstone-node-modules.mjs "$ROOT"

log "done (branch $BRANCH)"
