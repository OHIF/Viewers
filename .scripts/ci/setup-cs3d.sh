#!/usr/bin/env bash
# Portable CS3D integration setup — no GitHub token required.
#
# The committed .cs3d-ref file at the repo root is the CANONICAL source for which
# Cornerstone3D to build OHIF against; $CS3D_REF overrides it for ad-hoc runs.
# Resolved in priority:
#   1. $CS3D_REF environment variable (explicit override)
#   2. the first uncommented, non-blank line of .cs3d-ref (canonical)
#   3. nothing -> leave the published @cornerstonejs/* from the lockfile in place
#
# .cs3d-ref is kept in the repo permanently: disable integration by commenting out
# its ref line, NOT by deleting the file. See .cs3d-ref for the full instructions.
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
  log "no ref configured (no \$CS3D_REF and no active .cs3d-ref line) — using published @cornerstonejs/* from the lockfile"
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

# Obtain / refresh the CS3D checkout. Decide whether to force the existing
# checkout to the requested branch HEAD ("sync") or build whatever is already
# there in place.
#
#   - CI (Netlify/CircleCI/GitHub Actions all set $CI): libs/ is gitignored, so
#     it is a disposable cache artifact that is NEVER hand-edited. But a restored
#     cache makes the dir "present", and a naive "skip clone" then silently builds
#     a STALE CS3D commit with broken workspace links (tools resolving the
#     published @cornerstonejs/core instead of the local one). So on CI we
#     hard-reset to the branch HEAD and wipe ignored build/install artifacts
#     (node_modules, dist) so the reinstall below relinks the workspace cleanly.
#   - Local (no $CI): NEVER touch the working tree — preserve uncommitted changes
#     and (crucially) a local git worktree at libs/@cornerstonejs. Build in place;
#     run your own `git -C libs/@cornerstonejs pull` to update.
#
# Safety overrides (in priority): CS3D_SYNC=1 forces sync, CS3D_SYNC=0 forces
# build-in-place (e.g. a self-hosted CI that manages the dir itself). And even
# when sync is requested, a *linked git worktree* (.git is a file, not a dir) is
# never reset — that is the local-dev layout and wiping it would destroy work.
case "${CS3D_SYNC:-auto}" in
  1|true|yes) SHOULD_SYNC=1 ;;
  0|false|no) SHOULD_SYNC=0 ;;
  *)          if [[ -n "${CI:-}" ]]; then SHOULD_SYNC=1; else SHOULD_SYNC=0; fi ;;
esac

if [[ "$SHOULD_SYNC" == "1" && -f libs/@cornerstonejs/.git ]]; then
  log "libs/@cornerstonejs is a linked git worktree — refusing destructive sync, building in place"
  SHOULD_SYNC=0
fi

if [[ -e libs/@cornerstonejs/.git ]]; then
  if [[ "$SHOULD_SYNC" == "1" ]]; then
    log "libs/@cornerstonejs present — syncing to $BRANCH (hard reset; CI or CS3D_SYNC=1)"
    git -C libs/@cornerstonejs remote set-url origin "$REPO" 2>/dev/null \
      || git -C libs/@cornerstonejs remote add origin "$REPO"
    git -C libs/@cornerstonejs fetch --depth 1 origin "$BRANCH"
    git -C libs/@cornerstonejs reset --hard FETCH_HEAD
    git -C libs/@cornerstonejs clean -ffdx
  else
    log "libs/@cornerstonejs already present — building in place (preserving local changes; set CS3D_SYNC=1 to force-update)"
  fi
else
  log "cloning $REPO @ $BRANCH"
  git clone --depth 1 --branch "$BRANCH" "$REPO" libs/@cornerstonejs
fi

log "installing + building CS3D (build:esm)"
( cd libs/@cornerstonejs && pnpm install --frozen-lockfile && pnpm run build:esm )

log "linking built @cornerstonejs/* packages into OHIF node_modules"
node libs/@cornerstonejs/scripts/link-ohif-cornerstone-node-modules.mjs "$ROOT"

log "done (branch $BRANCH)"
