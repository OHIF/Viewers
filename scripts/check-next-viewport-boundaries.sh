#!/usr/bin/env bash
# Boundary check for the next-viewport migration seams (see
# extensions/cornerstone/src/services/ViewportService/backends/README.md).
#
# Enforces:
#   1. csUtils.isGenericViewport is called ONLY from the adapter dispatch module.
#   2. isNextViewportsEnabled() is called ONLY from the sanctioned flag-read list.
#   3. CornerstoneViewportService and the UI layer (hooks/, Viewport/, components/)
#      contain no per-lane branching at all.
#
# Run from the repo root: ./scripts/check-next-viewport-boundaries.sh
set -u

cd "$(dirname "$0")/.."

fail=0

report() {
  echo "BOUNDARY VIOLATION: $1"
  echo "$2" | sed 's/^/  /'
  echo "Add the divergence to the adapter, a backend, or nextViewportPolicies instead;"
  echo "if a new sanctioned site is genuinely required, update backends/README.md and this script."
  fail=1
}

# 1. isGenericViewport calls outside the adapter dispatch module (tests excluded).
generic_hits=$(grep -rn "isGenericViewport(" \
  --include='*.ts' --include='*.tsx' \
  extensions platform modes 2>/dev/null |
  grep -v '\.test\.' |
  grep -v 'services/ViewportService/adapter/getViewportAdapter\.ts' || true)
if [ -n "$generic_hits" ]; then
  report "isGenericViewport called outside adapter/getViewportAdapter.ts" "$generic_hits"
fi

# 2. isNextViewportsEnabled() calls outside the sanctioned list.
flag_hits=$(grep -rn "isNextViewportsEnabled()" \
  --include='*.ts' --include='*.tsx' \
  extensions platform modes 2>/dev/null |
  grep -v '\.test\.' |
  grep -v 'extensions/cornerstone/src/utils/nextViewports\.ts' |
  grep -v 'extensions/cornerstone/src/utils/nextViewportPolicies\.ts' |
  grep -v 'extensions/cornerstone/src/utils/getCornerstoneViewportType\.ts' |
  grep -v 'extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService\.ts' |
  grep -v 'extensions/cornerstone/src/services/SegmentationService/SegmentationService\.ts' |
  grep -v 'extensions/tmtv/src/getHangingProtocolModule\.ts' || true)
if [ -n "$flag_hits" ]; then
  report "isNextViewportsEnabled() called outside the sanctioned flag-read list" "$flag_hits"
fi

# 3. Per-lane predicates in the UI layer and the viewport service (must be zero).
ui_hits=$(grep -rn "isNextViewport(\|isGenericViewport(" \
  --include='*.ts' --include='*.tsx' \
  extensions/cornerstone/src/hooks \
  extensions/cornerstone/src/Viewport \
  extensions/cornerstone/src/components \
  extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts 2>/dev/null |
  grep -v '\.test\.' || true)
if [ -n "$ui_hits" ]; then
  report "per-lane predicate in the UI layer / CornerstoneViewportService" "$ui_hits"
fi

if [ "$fail" -eq 0 ]; then
  echo "next-viewport boundaries OK"
fi
exit "$fail"
