import { useSmartScrollbarContext } from './SmartScrollbar';
import { getIndicatorLayout } from './utils';

// ── Baked Design 27 constants ──────────────────────────────────
const INDICATOR_SIZE = 8;
const BORDER_WIDTH = 1;
const INDICATOR_COLOR = 'hsl(var(--foreground) / 0.9)';
const BORDER_COLOR = 'hsl(var(--neutral) / 0.9)';

interface SmartScrollbarIndicatorProps {
  className?: string;
}

export function SmartScrollbarIndicator({ className }: SmartScrollbarIndicatorProps) {
  const { value, totalSlices, trackHeight, effectiveWidth, fillPadding } = useSmartScrollbarContext();

  if (trackHeight === 0) return null;

  const { totalWidth, totalHeight, fillWidth, fillHeight, leftPos } = getIndicatorLayout(
    effectiveWidth,
    INDICATOR_SIZE,
    BORDER_WIDTH,
  );

  const offsetY = (totalHeight - INDICATOR_SIZE) / 2;
  const fillAreaTop = fillPadding;
  const fillAreaHeight = trackHeight - fillPadding * 2;
  const maxY = fillAreaHeight - INDICATOR_SIZE;
  const y = fillAreaTop + (totalSlices <= 1 ? 0 : (value / (totalSlices - 1)) * maxY);

  return (
    <div
      className={`absolute pointer-events-none ${className ?? ''}`}
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
