#!/usr/bin/env bash
#
# Apply the `CS3D_REF:` line of the pull request body to this checkout, for
# the CI systems that are not GitHub Actions: the CircleCI unit test and
# Cypress jobs, and the Netlify deploy preview. The GitHub Playwright workflow
# does the same work in its own steps (.github/workflows/playwright.yml).
#
# Run it from the repository root, AFTER the ordinary `pnpm install`:
#   - no CS3D_REF line: nothing changes.
#   - a version (5.10.3, 5.x, `<branch> now <version>`): the @cornerstonejs/*
#     pins move to that version, and pnpm installs again.
#   - a branch: the script clones that branch of cornerstonejs/cornerstone3D into
#     libs/@cornerstonejs, builds it, and links it into node_modules.
#
# .scripts/cs3d-read-ref.mjs reads and validates the line, with the rules of
# the gate job of the Playwright workflow.
#
# Usage: bash .scripts/ci/cs3d-apply-ref.sh [--body-file <file>]
#   --body-file reads a saved body instead of the pull request (for a test).

set -euo pipefail

cd "$(dirname "$0")/../.."
ROOT="$PWD"

# One value per line: kind, ref, history, defer. A rejected line prints
# nothing, and the process substitution hides the exit status, so the result
# is checked by value.
mapfile -t fields < <(node .scripts/cs3d-read-ref.mjs "$@")
kind="${fields[0]:-}"
ref="${fields[1]:-}"
history="${fields[2]:-}"
defer="${fields[3]:-}"
if [ -z "$kind" ]; then
  echo "[cs3d-apply-ref] cs3d-read-ref.mjs rejected the CS3D_REF line; see the message above." >&2
  exit 1
fi

case "$kind" in
  none)
    echo "[cs3d-apply-ref] No CS3D_REF line: this job uses the pinned @cornerstonejs/* versions."
    ;;

  version)
    resolved=$(node .scripts/cs3d-resolve-version.mjs "$ref")
    echo "[cs3d-apply-ref] CS3D version: $ref -> $resolved${history:+ (was branch $history)}"
    changed_file=$(mktemp)
    if [ "$defer" = "true" ]; then
      GITHUB_OUTPUT="$changed_file" node .scripts/cs3d-set-version.mjs "$resolved" --only-if-newer
    else
      GITHUB_OUTPUT="$changed_file" node .scripts/cs3d-set-version.mjs "$resolved"
    fi
    if grep -qx 'changed=true' "$changed_file"; then
      pnpm install --no-frozen-lockfile
    fi
    rm -f "$changed_file"
    ;;

  branch)
    target="libs/@cornerstonejs"
    if [ -e "$target" ]; then
      # A developer machine keeps its own CS3D checkout here. Only a CI
      # checkout, which is disposable, may be replaced.
      if [ "${CI:-}" != "true" ]; then
        echo "[cs3d-apply-ref] $target already exists, and this is not CI. Link your own checkout with 'pnpm cs3d:link'." >&2
        exit 1
      fi
      rm -rf "$target"
    fi
    echo "[cs3d-apply-ref] Cloning cornerstonejs/cornerstone3D branch $ref"
    git clone --depth 1 --branch "$ref" https://github.com/cornerstonejs/cornerstone3D.git "$target"
    (cd "$target" && pnpm install --frozen-lockfile && pnpm run build:esm)
    node "$target/scripts/link-ohif-cornerstone-node-modules.mjs" "$ROOT"
    echo "[cs3d-apply-ref] Linked CS3D branch $ref ($(git -C "$target" rev-parse --short HEAD)) into node_modules"
    ;;

  *)
    echo "[cs3d-apply-ref] Unknown kind '$kind' from cs3d-read-ref.mjs" >&2
    exit 1
    ;;
esac
