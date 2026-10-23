#!/usr/bin/env bash
#
# Run a command while holding the nashua Playwright mutex.
#
# Only one Playwright run may execute at a time on the shared nashua self-hosted
# runner — across THIS repo (OHIF) AND the cornerstone3D repo. GitHub's
# `concurrency:` is scoped per-repository and cannot coordinate across the two
# orgs, so the mutex lives on the box's filesystem.
#
# This is OHIF's own copy (the script can't be shared across separate repos). It
# MUST use the SAME lock path as cornerstone3D's copy (NASHUA_LOCK_FILE default
# below) — if the paths differ, the mutex silently does nothing.
#
# flock holds the lock via fd 9 and it releases automatically when the wrapped
# command exits — including on job cancel / timeout / SIGKILL — so there are no
# stale locks to clean up.
#
# Usage: .scripts/ci/with-nashua-lock.sh <command> [args...]

# Strict mode: -e abort on any unhandled command failure, -u treat use of an
# unset variable as an error, -o pipefail make a pipeline fail if ANY stage
# fails (not just the last). Catches mistakes early instead of pressing on.
set -euo pipefail

LOCK="${NASHUA_LOCK_FILE:-/var/tmp/nashua-playwright.lock}"   # MUST match cornerstone3D's copy
LOCK_WAIT="${NASHUA_LOCK_WAIT:-5400}"                          # max seconds to wait

# Guard: a command to wrap is required. With no arguments there is nothing to
# run, so print usage and exit instead of silently grabbing and releasing the
# lock for no reason (which would mask a mis-wired workflow step).
if [ "$#" -eq 0 ]; then
  echo "usage: $0 <command> [args...]" >&2
  exit 2
fi

# Open the lock file on fd 9 (read-write, create if missing, never truncate).
exec 9<>"$LOCK" || { echo "::error::cannot open lock file $LOCK"; exit 1; }

# Try instantly; if busy, report who holds it, then block up to LOCK_WAIT.
if ! flock -n 9; then
  echo "nashua Playwright runner busy — held by: $(cat "${LOCK}.info" 2>/dev/null || echo unknown). Waiting up to ${LOCK_WAIT}s…"
  if ! flock -w "$LOCK_WAIT" 9; then
    echo "::error::Timed out after ${LOCK_WAIT}s waiting for the nashua Playwright lock"
    exit 1
  fi
fi

# Record the current holder for other jobs' "held by" message (best-effort).
echo "${GITHUB_REPOSITORY:-local}#${GITHUB_RUN_ID:-0} @ $(date -u +%FT%TZ 2>/dev/null || true)" > "${LOCK}.info" 2>/dev/null || true
echo "✅ Acquired nashua Playwright lock ($LOCK); running: $*"

# Replace the shell with the command. fd 9 is inherited (not close-on-exec), so
# the lock is held for the whole command and released when it exits.
exec "$@"
