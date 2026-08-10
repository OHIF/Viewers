#!/usr/bin/env bash
# Boundary check for the viewport-grid state refactor seams (see
# VIEWPORT_STATE_ARCHITECTURE_PLAN.md, phase 6 guardrails).
#
# Enforces:
#   1. ViewportGridService.EVENTS stays frozen at the 6 known keys; new
#      cross-cutting notifications belong in store state read via select().
#   2. The render path in ViewportGrid.tsx / ViewportHost.tsx never calls
#      viewportGridService.getState(); event handlers that must read the
#      state of the moment mark the line with a trailing '// event-time read'.
#   3. Backends and the adapter stay event-silent: no .subscribe(,
#      addEventListener( or _broadcastEvent( inside the ViewportService
#      backends/ and adapter/ directories.
#   4. Overlays use the per-viewport runtime channel for grid/viewport state;
#      element.addEventListener( is allowed only in the enumerated files that
#      listen to cornerstone render events dispatched on the element itself.
#
# Run from the repo root: ./scripts/check-grid-state-boundaries.sh
set -u

cd "$(dirname "$0")/.."

fail=0

report() {
  echo "BOUNDARY VIOLATION: $1"
  echo "$2" | sed 's/^/  /'
  echo "$3"
  fail=1
}

# 1. ViewportGridService.EVENTS must contain exactly the 6 known keys.
grid_service='platform/core/src/services/ViewportGridService/ViewportGridService.ts'
expected_events=$(LC_ALL=C sort <<'EOF'
ACTIVE_VIEWPORT_ID_CHANGED
LAYOUT_CHANGED
GRID_STATE_CHANGED
GRID_SIZE_CHANGED
VIEWPORTS_READY
VIEWPORT_ONDROP_HANDLED
EOF
)
actual_events=$(sed -n '/EVENTS = {/,/};/p' "$grid_service" |
  grep -o '^ *[A-Z_][A-Z0-9_]*:' | tr -d ' :' | LC_ALL=C sort)
if [ "$actual_events" != "$expected_events" ]; then
  report "ViewportGridService.EVENTS no longer matches the 6 known keys" \
    "$(diff <(echo "$expected_events") <(echo "$actual_events") | sed -n 's/^[<>]/&/p')" \
    "Do not add ViewportGridService events; put the fact in the grid store state and let consumers read it via useViewportGrid(selector) / select()."
fi

# 2. No render-path getState() in the grid components; event handlers mark
#    the sanctioned line with a trailing '// event-time read'.
getstate_hits=$(grep -n 'viewportGridService\.getState(' \
  platform/app/src/components/ViewportGrid.tsx \
  platform/app/src/components/ViewportHost.tsx 2>/dev/null |
  grep -v '// event-time read$' || true)
if [ -n "$getstate_hits" ]; then
  report "viewportGridService.getState() in the grid render path" "$getstate_hits" \
    "Render code must read grid state via useViewportGrid(selector); if this is an event handler that needs the state at event time, end the line with '// event-time read'."
fi

# 3. Backends and the adapter stay event-silent (allowlist: none today).
silent_hits=$(grep -rn '\.subscribe(\|addEventListener(\|_broadcastEvent(' \
  --include='*.ts' --include='*.tsx' \
  extensions/cornerstone/src/services/ViewportService/backends \
  extensions/cornerstone/src/services/ViewportService/adapter 2>/dev/null |
  grep -v '\.test\.' || true)
if [ -n "$silent_hits" ]; then
  report "event wiring inside ViewportService backends/ or adapter/" "$silent_hits" \
    "Backends and the adapter are pure mount/update bodies; move event wiring to CornerstoneViewportService or the runtime channel."
fi

# 4. Overlays use the runtime channel; element listeners are allowed only in
#    the files below, which listen to cornerstone render events that are
#    dispatched on the viewport element itself (not grid/viewport state):
#    - ViewportImageSliceLoadingIndicator.tsx: STACK_VIEWPORT_SCROLL /
#      IMAGE_LOAD_ERROR / STACK_NEW_IMAGE loading-progress events.
#    - ViewportOrientationMarkers.tsx: CAMERA_MODIFIED to re-derive markers.
#    - CustomizableViewportOverlay.tsx: CAMERA_MODIFIED to update the scale.
#    - ViewportSliceProgressScrollbar/hooks.ts: CAMERA_MODIFIED to track the
#      current slice for the scrollbar.
overlay_hits=$(grep -rn 'element\.addEventListener(' \
  --include='*.ts' --include='*.tsx' \
  extensions/cornerstone/src/Viewport/Overlays 2>/dev/null |
  grep -v '\.test\.' |
  grep -v 'Overlays/ViewportImageSliceLoadingIndicator\.tsx' |
  grep -v 'Overlays/ViewportOrientationMarkers\.tsx' |
  grep -v 'Overlays/CustomizableViewportOverlay\.tsx' |
  grep -v 'Overlays/ViewportSliceProgressScrollbar/hooks\.ts' || true)
if [ -n "$overlay_hits" ]; then
  report "element.addEventListener in an overlay outside the allowlist" "$overlay_hits" \
    "Overlays read viewport state via useViewportState / the runtime channel; only cornerstone render events dispatched on the element may be wired directly (update the allowlist here with a reason if so)."
fi

if [ "$fail" -eq 0 ]; then
  echo "grid-state boundaries OK"
fi
exit "$fail"
