import React from 'react';
import { useSmartScrollbarLayoutContext, useSmartScrollbarScrollContext } from './SmartScrollbar';
import { computeIndicatorTopOffsetInFill } from './utils';

interface SmartScrollbarIndicatorProps {
  className?: string;
}

export function SmartScrollbarIndicator({ className }: SmartScrollbarIndicatorProps) {
  const {
    total,
    trackHeight,
    effectiveWidth,
    fillPadding,
    indicatorTotalWidth,
    indicatorTotalHeight,
    renderIndicator,
  } = useSmartScrollbarLayoutContext();

  const value = useSmartScrollbarScrollContext();

  if (trackHeight === 0 || total <= 1) {
    return null;
  }

  // Horizontal: center on the contracting inner width (not the full physical track).
  const leftPos = effectiveWidth / 2 - indicatorTotalWidth / 2;

  const fillAreaTop = fillPadding;
  // Vertical: same fill strip as SmartScrollbarFill — full track height minus padding.
  const pixelCount = Math.max(0, Math.floor(trackHeight - fillPadding * 2));
  if (pixelCount === 0) {
    return null;
  }

  const clampedValue = Math.max(0, Math.min(total - 1, value));
  const topOffsetInFill = computeIndicatorTopOffsetInFill(
    clampedValue,
    total,
    pixelCount,
    indicatorTotalHeight
  );
  const topPos = fillAreaTop + topOffsetInFill;

  return (
    <div
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{
        left: leftPos,
        top: topPos,
        width: indicatorTotalWidth,
        height: indicatorTotalHeight,
        transition: 'left 300ms ease, opacity 300ms ease',
      }}
    >
      {renderIndicator(React)}
    </div>
  );
}
