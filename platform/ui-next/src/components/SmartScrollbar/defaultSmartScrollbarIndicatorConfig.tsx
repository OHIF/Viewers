import React from 'react';
import { type SmartScrollbarIndicatorConfig } from './SmartScrollbar';

/** Ring inset for the default pill SVG (outer size is indicator total width × height). */
const BORDER_WIDTH = 1;

const INDICATOR_COLOR = 'hsl(var(--foreground) / 0.9)';
const BORDER_COLOR = 'hsl(var(--neutral) / 0.9)';
const TOTAL_WIDTH = 12;
const TOTAL_HEIGHT = 7;

function DefaultIndicator() {
  const borderWidth = BORDER_WIDTH;
  const fillWidth = Math.max(0, TOTAL_WIDTH - borderWidth * 2);
  const fillHeight = Math.max(0, TOTAL_HEIGHT - borderWidth * 2);
  return (
    <svg
      width={TOTAL_WIDTH}
      height={TOTAL_HEIGHT}
      viewBox={`0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`}
    >
      <rect
        x={0}
        y={0}
        width={TOTAL_WIDTH}
        height={TOTAL_HEIGHT}
        rx={TOTAL_HEIGHT / 2}
        ry={TOTAL_HEIGHT / 2}
        fill={BORDER_COLOR}
      />
      <rect
        x={borderWidth}
        y={borderWidth}
        width={fillWidth}
        height={fillHeight}
        rx={fillHeight / 2}
        ry={fillHeight / 2}
        fill={INDICATOR_COLOR}
      />
    </svg>
  );
}

export const DEFAULT_INDICATOR_CONFIG: SmartScrollbarIndicatorConfig = {
  totalWidth: TOTAL_WIDTH,
  totalHeight: TOTAL_HEIGHT,
  renderIndicator: (_react: typeof React) => <DefaultIndicator />,
};
