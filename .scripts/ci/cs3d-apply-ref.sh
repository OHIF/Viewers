#!/usr/bin/env bash
#
# Apply a CS3D ref to this checkout. The Playwright workflow, the CircleCI
# unit test, package build and Cypress jobs, and the Netlify deploy preview
# all use this one script.
#
# Run it from the repository root, AFTER the ordinary `pnpm install`:
#   - kind none: nothing changes.
#   - kind version (5.10.3, 5.x, `<branch> now <version>`): the @cornerstonejs/*
#     pins move to that version, and pnpm installs again.
#   - kind branch: the script clones that branch of cornerstonejs/cornerstone3D
#     into libs/@cornerstonejs, builds it, and links it into node_modules.
#
# Usage:
#   bash .scripts/ci/cs3d-apply-ref.sh --kind <kind> --ref <ref> --defer <true|false> [--history <branch>]
#       Apply a ref that a caller already read and validated. The Playwright
#       workflow passes the outputs of its gate job here, so the self-hosted
#       runner acts only on the ref that the gate checked and, for a fork, that
#       a reviewer approved. This mode never reads the pull request.
#   bash .scripts/ci/cs3d-apply-ref.sh [--body-file <file>]
#       CircleCI and the Netlify deploy preview: read the `CS3D_REF:` line of
#       the pull request with .scripts/cs3d-read-ref.mjs. Under GitHub Actions
#       this mode would find no pull request and apply nothing, so the script
#       refuses it there.
#   bash .scripts/ci/cs3d-apply-ref.sh --after-build
#       Netlify, after the build: delete what this script changed, so that the
#       build cache never gives a linked or re-pinned CS3D to a later build.
#
# Under GitHub Actions, the script writes `version` (the resolved version) and
# `changed` (true when CS3D differs from the pin) to GITHUB_OUTPUT.

set -euo pipefail

cd "$(dirname "$0")/../.."
ROOT="$PWD"
MARKER="node_modules/.cs3d-ref-applied"

# A build on Netlify's servers. A local `netlify build` sets NETLIFY_LOCAL and
# has no BUILD_ID, so it never counts.
on_netlify() {
  [ "${NETLIFY:-}" = "true" ] && [ -n "${BUILD_ID:-}" ] && [ -z "${NETLIFY_LOCAL:-}" ]
}

if [ "${1:-}" = "--after-build" ]; then
  if on_netlify && [ -e "$MARKER" ]; then
    echo "[cs3d-apply-ref] Deleting node_modules and libs/@cornerstonejs, so that the build cache does not keep the CS3D of this PR."
    rm -rf node_modules libs/@cornerstonejs
    # A version ref rewrote the pins; the build is done, so a failure here
    # must not fail it.
    git checkout -- . || echo "[cs3d-apply-ref] Could not restore the tracked files." >&2
  fi
  exit 0
fi

# Netlify keeps ignored files and node_modules between builds. Start every
# Netlify build from the pinned CS3D, whatever an earlier build left.
if on_netlify; then
  if [ -e libs/@cornerstonejs ]; then
    echo "[cs3d-apply-ref] Deleting libs/@cornerstonejs that an earlier Netlify build left."
    rm -rf libs/@cornerstonejs
  fi
  if [ -L node_modules/@cornerstonejs/core ] || [ -e "$MARKER" ]; then
    echo "[cs3d-apply-ref] The build cache holds the CS3D of an earlier PR: reinstalling."
    rm -rf node_modules
    pnpm install --frozen-lockfile
  fi
fi

kind=""
ref=""
defer=""
history=""
if [ "${1:-}" = "--kind" ]; then
  while [ $# -gt 0 ]; do
    case "$1" in
      --kind) kind="$2"; shift 2 ;;
      --ref) ref="$2"; shift 2 ;;
      --defer) defer="$2"; shift 2 ;;
      --history) history="$2"; shift 2 ;;
      *) echo "[cs3d-apply-ref] Unknown argument '$1'" >&2; exit 1 ;;
    esac
  done
else
  if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
    echo "[cs3d-apply-ref] Under GitHub Actions, pass the gate outputs with --kind, --ref and --defer." >&2
    exit 1
  fi
  # One value per line: kind, ref, history, defer. A rejected line prints
  # nothing, and the process substitution hides the exit status, so the result
  # is checked by value.
  mapfile -t fields < <(node .scripts/cs3d-read-ref.mjs "$@")
  kind="${fields[0]:-}"
  ref="${fields[1]:-}"
  history="${fields[2]:-}"
  defer="${fields[3]:-}"
  if [ -z "$kind" ]; then
    echo "[cs3d-apply-ref] cs3d-read-ref.mjs gave no CS3D ref; see the message above." >&2
    exit 1
  fi
fi

output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "$1" >> "$GITHUB_OUTPUT"; fi
}

case "$kind" in
  none)
    echo "[cs3d-apply-ref] No CS3D_REF line: this job uses the pinned @cornerstonejs/* versions."
    output "changed=false"
    ;;

  version)
    resolved=$(node .scripts/cs3d-resolve-version.mjs "$ref")
    echo "[cs3d-apply-ref] CS3D version: $ref -> $resolved${history:+ (was branch $history)}"
    output "version=$resolved"
    changed_file=$(mktemp)
    if [ "$defer" = "true" ]; then
      GITHUB_OUTPUT="$changed_file" node .scripts/cs3d-set-version.mjs "$resolved" --only-if-newer
    else
      GITHUB_OUTPUT="$changed_file" node .scripts/cs3d-set-version.mjs "$resolved"
    fi
    if grep -qx 'changed=true' "$changed_file"; then
      # No lockfile covers the new tree, so no install script of it may run.
      # The ordinary install before this script already ran the OHIF scripts.
      pnpm install --no-frozen-lockfile --ignore-scripts
      touch "$MARKER"
      output "changed=true"
    else
      output "changed=false"
    fi
    rm -f "$changed_file"
    ;;

  branch)
    target="libs/@cornerstonejs"
    if [ -e "$target" ]; then
      # A developer machine keeps its own CS3D checkout here. Only a CI
      # checkout, which is disposable, may be replaced. CI=true is not
      # enough: some developers set it in their shell.
      if [ "${CIRCLECI:-}" != "true" ] && [ "${GITHUB_ACTIONS:-}" != "true" ] && ! on_netlify; then
        echo "[cs3d-apply-ref] $target already exists, and this is not CI. Link your own checkout with 'pnpm cs3d:link'." >&2
        exit 1
      fi
      rm -rf "$target"
    fi
    echo "[cs3d-apply-ref] Cloning cornerstonejs/cornerstone3D branch $ref"
    git clone --depth 1 --branch "$ref" https://github.com/cornerstonejs/cornerstone3D.git "$target"
    # The install, build and link run code of the CS3D branch, which needs no
    # GITHUB_TOKEN. Its packages/docs/preinstall.js would print the token and
    # write it into the global git config.
    (cd "$target" && unset GITHUB_TOKEN && pnpm install --frozen-lockfile && pnpm run build:esm)
    env -u GITHUB_TOKEN node "$target/scripts/link-ohif-cornerstone-node-modules.mjs" "$ROOT"
    touch "$MARKER"
    output "changed=true"
    echo "[cs3d-apply-ref] Linked CS3D branch $ref ($(git -C "$target" rev-parse --short HEAD)) into node_modules"
    ;;

  *)
    echo "[cs3d-apply-ref] Unknown kind '$kind'" >&2
    exit 1
    ;;
esac
