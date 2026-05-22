import React from 'react';
import { createPortal } from 'react-dom';
import { useSmartScrollbarLayoutContext } from './SmartScrollbar';
import { computePixelFilledFromMarked } from './utils';

// ── Endpoint cap dimensions and color ───────────────────────────
const CAP_SIZE = 4;
const CAP_HEIGHT = CAP_SIZE / 2 + 1; // 3
const CAP_COLOR = 'hsl(var(--neutral) / 1.0)';

interface SmartScrollbarEndpointsProps {
  marked: Uint8Array;
  /**
   * Change token that MUST be bumped when the contents of `marked` change while
   * the `marked` array reference stays the same (in-place mutation).
   *
   * Recommended: manage `marked` + `version` together via `useByteArray()`.
   */
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
  const { trackHeight, trackWidth, fillPadding, stableLayerEl } =
    useSmartScrollbarLayoutContext();

  const fillAreaTop = fillPadding;
  const pixelCount = Math.max(0, Math.floor(trackHeight - fillPadding * 2));
  if (pixelCount === 0) return null;
  const pixelFilled = computePixelFilledFromMarked(marked, pixelCount);

  // Scan for the first and last filled pixel row in O(n) so endpoints align
  // exactly with the fill rendering in pixel space.
  let firstFilledPixel = -1;
  let lastFilledPixel = -1;
  for (let pixel = 0; pixel < pixelFilled.length; pixel++) {
    if (pixelFilled[pixel]) {
      firstFilledPixel = pixel;
      break;
    }
  }
  for (let pixel = pixelFilled.length - 1; pixel >= 0; pixel--) {
    if (pixelFilled[pixel]) {
      lastFilledPixel = pixel;
      break;
    }
  }

  if (firstFilledPixel === -1 || trackHeight === 0 || !stableLayerEl) return null;

  // Use trackWidth (always 8px) not effectiveWidth — endpoints must stay
  // stationary during contraction/expansion transitions.
  const cx = trackWidth / 2;
  const halfCap = CAP_SIZE / 2;
  const topEdge = fillAreaTop + firstFilledPixel;
  const bottomEdge = fillAreaTop + (lastFilledPixel + 1);

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
