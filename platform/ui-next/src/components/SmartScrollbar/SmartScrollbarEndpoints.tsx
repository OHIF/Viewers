import React from 'react';
import { createPortal } from 'react-dom';
import { useSmartScrollbarContext } from './SmartScrollbar';

// ── Endpoint cap dimensions and color ───────────────────────────
const CAP_SIZE = 4;
const CAP_HEIGHT = CAP_SIZE / 2 + 1; // 3
const CAP_COLOR = 'hsl(var(--neutral) / 1.0)';

interface SmartScrollbarEndpointsProps {
  slices: Set<number>;
  className?: string;
}

export function SmartScrollbarEndpoints({ slices, className }: SmartScrollbarEndpointsProps) {
  const { totalSlices, trackHeight, trackWidth, fillPadding, stableLayerEl } = useSmartScrollbarContext();

  if (slices.size === 0 || trackHeight === 0 || !stableLayerEl) return null;

  const fillAreaTop = fillPadding;
  const fillAreaHeight = trackHeight - fillPadding * 2;

  let minSlice = Infinity;
  let maxSlice = -Infinity;
  for (const s of slices) {
    if (s < minSlice) minSlice = s;
    if (s > maxSlice) maxSlice = s;
  }

  // Use trackWidth (always 8px) not effectiveWidth — endpoints must stay
  // stationary during contraction/expansion transitions.
  const cx = trackWidth / 2;
  const halfCap = CAP_SIZE / 2;
  const topEdge = fillAreaTop + (minSlice / totalSlices) * fillAreaHeight;
  const bottomEdge = fillAreaTop + ((maxSlice + 1) / totalSlices) * fillAreaHeight;

  // Portal into the stable layer so position isn't affected by the
  // contracting track div's width transition.
  return createPortal(
    <svg
      width={trackWidth}
      height={trackHeight}
      className={`absolute inset-0 pointer-events-none ${className ?? ''}`}
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
    stableLayerEl,
  );
}
