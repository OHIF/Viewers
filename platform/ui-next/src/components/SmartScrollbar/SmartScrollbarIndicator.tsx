import React from 'react';
import { useSmartScrollbarLayoutContext, useSmartScrollbarScrollContext } from './SmartScrollbar';
import { getIndicatorLayout } from './utils';

// ── Indicator dimensions and colors ─────────────────────────────
const INDICATOR_SIZE = 8;
const BORDER_WIDTH = 1;
const INDICATOR_COLOR = 'hsl(var(--foreground) / 0.9)';
const BORDER_COLOR = 'hsl(var(--neutral) / 0.9)';

interface SmartScrollbarIndicatorProps {
  className?: string;
}

export function SmartScrollbarIndicator({ className }: SmartScrollbarIndicatorProps) {
  const { total, trackHeight, effectiveWidth, fillPadding } =
    useSmartScrollbarLayoutContext();
  const value = useSmartScrollbarScrollContext();

  if (trackHeight === 0 || total <= 1) return null;

  const { totalWidth, totalHeight, fillWidth, fillHeight, leftPos } = getIndicatorLayout(
    effectiveWidth,
    INDICATOR_SIZE,
    BORDER_WIDTH
  );

  const offsetY = (totalHeight - INDICATOR_SIZE) / 2;
  const fillAreaTop = fillPadding;
  const pixelCount = Math.max(0, Math.floor(trackHeight - fillPadding * 2));
  if (pixelCount === 0) return null;

  // Align the indicator with the item’s pixel bucket(s) so it sits “over” the
  // same pixel-space mapping used by fill/endpoints.
  const clampedValue = Math.max(0, Math.min(total - 1, value));
  const itemStartPx = Math.floor((clampedValue * pixelCount) / total);
  const maxTopInFill = Math.max(0, pixelCount - INDICATOR_SIZE);
  const topInFill = Math.max(0, Math.min(maxTopInFill, itemStartPx));
  const y = fillAreaTop + topInFill;
  return (
    <div
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{
        left: leftPos,
        top: y - offsetY,
        width: totalWidth,
        height: totalHeight,
        transition: 'left 300ms ease, opacity 300ms ease',
      }}
    >
      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      >
        {/* Border rect */}
        <rect
          x={0}
          y={0}
          width={totalWidth}
          height={totalHeight}
          rx={totalHeight / 2}
          ry={totalHeight / 2}
          fill={BORDER_COLOR}
        />
        {/* Fill rect */}
        <rect
          x={BORDER_WIDTH}
          y={BORDER_WIDTH}
          width={fillWidth}
          height={fillHeight}
          rx={fillHeight / 2}
          ry={fillHeight / 2}
          fill={INDICATOR_COLOR}
        />
      </svg>
    </div>
  );
}
