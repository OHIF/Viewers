import React from 'react';
import { useSmartScrollbarLayoutContext, useSmartScrollbarScrollContext } from './SmartScrollbar';

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

  const totalWidth = indicatorTotalWidth;
  const totalHeight = indicatorTotalHeight;
  const value = useSmartScrollbarScrollContext();

  if (trackHeight === 0 || total <= 1) {
    return null;
  }

  const leftPos = effectiveWidth / 2 - totalWidth / 2;

  const fillAreaTop = fillPadding;
  const pixelCount = Math.max(0, Math.floor(trackHeight - fillPadding * 2));
  if (pixelCount === 0) {
    return null;
  }

  // Align the indicator with the item’s pixel bucket(s) so it sits “over” the
  // same pixel-space mapping used by fill/endpoints.
  const clampedValue = Math.max(0, Math.min(total - 1, value));
  const itemStartPx = Math.floor((clampedValue * pixelCount) / total);
  const maxTopInFill = Math.max(0, pixelCount - totalHeight);
  const topPos = fillAreaTop + Math.min(maxTopInFill, itemStartPx);

  return (
    <div
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{
        left: leftPos,
        top: topPos,
        width: totalWidth,
        height: totalHeight,
        transition: 'left 300ms ease, opacity 300ms ease',
      }}
    >
      {renderIndicator(React.createElement)}
    </div>
  );
}
