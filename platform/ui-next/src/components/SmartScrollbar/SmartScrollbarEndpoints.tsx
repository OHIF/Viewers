import React from 'react';
import { createPortal } from 'react-dom';
import { useSmartScrollbarLayoutContext } from './SmartScrollbar';

// ── Endpoint cap dimensions and color ───────────────────────────
const CAP_SIZE = 4;
const CAP_HEIGHT = CAP_SIZE / 2 + 1; // 3
const CAP_COLOR = 'hsl(var(--neutral) / 1.0)';

interface SmartScrollbarEndpointsProps {
  marked: Uint8Array;
  version: number;
  className?: string;
}

export const SmartScrollbarEndpoints = React.memo(function SmartScrollbarEndpoints({
  marked,
  // `marked` is mutated in-place (stable reference). We accept `version` only to
  // invalidate React.memo and force a re-render when the bytes change. The
  // leading underscore indicates the value is intentionally unused in this component.
  version: _version,
  className,
}: SmartScrollbarEndpointsProps) {
  const { total, trackHeight, trackWidth, fillPadding, stableLayerEl } =
    useSmartScrollbarLayoutContext();

  // Scan for the first and last set byte in O(n) — much cheaper than a Set
  // iteration and naturally gives us the two endpoints we need.
  let minSlice = -1;
  let maxSlice = -1;
  for (let i = 0; i < marked.length; i++) {
    if (marked[i]) {
      minSlice = i;
      break;
    }
  }
  for (let i = marked.length - 1; i >= 0; i--) {
    if (marked[i]) {
      maxSlice = i;
      break;
    }
  }

  if (minSlice === -1 || trackHeight === 0 || !stableLayerEl) return null;

  const fillAreaTop = fillPadding;
  const fillAreaHeight = trackHeight - fillPadding * 2;

  // Use trackWidth (always 8px) not effectiveWidth — endpoints must stay
  // stationary during contraction/expansion transitions.
  const cx = trackWidth / 2;
  const halfCap = CAP_SIZE / 2;
  const topEdge = fillAreaTop + (minSlice / total) * fillAreaHeight;
  const bottomEdge = fillAreaTop + ((maxSlice + 1) / total) * fillAreaHeight;

  // Portal into the stable layer so position isn't affected by the
  // contracting track div's width transition.
  return createPortal(
    <svg
      width={trackWidth}
      height={trackHeight}
      className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
    >
      {/* Top cap */}
      <rect
        x={cx - halfCap}
        y={topEdge - CAP_HEIGHT}
        width={CAP_SIZE}
        height={CAP_HEIGHT}
        fill={CAP_COLOR}
      />
      {/* Bottom cap */}
      <rect
        x={cx - halfCap}
        y={bottomEdge}
        width={CAP_SIZE}
        height={CAP_HEIGHT}
        fill={CAP_COLOR}
      />
    </svg>,
    stableLayerEl
  );
});
