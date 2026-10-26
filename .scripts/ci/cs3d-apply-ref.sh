#!/usr/bin/env bash
#
# Apply a CS3D ref to this checkout. The Playwright workflow and the CircleCI
# unit test, package build and Cypress jobs all use this one script.
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
#       CircleCI: read the `CS3D_REF:` line of the pull request with
#       .scripts/cs3d-read-ref.mjs. Under GitHub Actions this mode would find no
#       pull request and apply nothing, so the script refuses it there.
#
# Under GitHub Actions, the script writes `version` (the resolved version) and
# `changed` (true when CS3D differs from the pin) to GITHUB_OUTPUT.

set -euo pipefail

cd "$(dirname "$0")/../.."
ROOT="$PWD"

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
    echo "[cs3d-apply-ref] cs3d-read-ref.mjs rejected the CS3D_REF line; see the message above." >&2
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
      if [ "${CIRCLECI:-}" != "true" ] && [ "${GITHUB_ACTIONS:-}" != "true" ]; then
        echo "[cs3d-apply-ref] $target already exists, and this is not CI. Link your own checkout with 'pnpm cs3d:link'." >&2
        exit 1
      fi
      rm -rf "$target"
    fi
    echo "[cs3d-apply-ref] Cloning cornerstonejs/cornerstone3D branch $ref"
    git clone --depth 1 --branch "$ref" https://github.com/cornerstonejs/cornerstone3D.git "$target"
    (cd "$target" && pnpm install --frozen-lockfile && pnpm run build:esm)
    node "$target/scripts/link-ohif-cornerstone-node-modules.mjs" "$ROOT"
    output "changed=true"
    echo "[cs3d-apply-ref] Linked CS3D branch $ref ($(git -C "$target" rev-parse --short HEAD)) into node_modules"
    ;;

  *)
    echo "[cs3d-apply-ref] Unknown kind '$kind'" >&2
    exit 1
    ;;
esac
