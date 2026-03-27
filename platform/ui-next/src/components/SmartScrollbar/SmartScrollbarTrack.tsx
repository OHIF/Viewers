import React, { useId } from 'react';
import { useSmartScrollbarContext } from './SmartScrollbar';

// ── Dot-grid pattern constants ──────────────────────────────────
const DOT_SIZE = 2;
const DOT_GAP = 4;
const DOT_STEP = DOT_SIZE + DOT_GAP; // 6px
const DOT_RADIUS = DOT_SIZE / 2;

interface SmartScrollbarTrackProps {
  className?: string;
  children?: React.ReactNode;
}

export function SmartScrollbarTrack({ className, children }: SmartScrollbarTrackProps) {
  const { trackHeight, effectiveWidth, isLoading } = useSmartScrollbarContext();
  const patternId = useId();

  if (trackHeight === 0) return null;

  const w = effectiveWidth;
  const h = trackHeight;
  const dotColor = `hsl(var(--neutral) / 0.5)`;

  return (
    <div className={`absolute inset-0 ${className ?? ''}`}>
      {/* Dot-grid background — visible only during loading */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ width: w, height: h, opacity: isLoading ? 1 : 0 }}
      >
        <svg width={w} height={h} className="absolute inset-0">
          <defs>
            <pattern
              id={patternId}
              width={DOT_STEP}
              height={DOT_STEP}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={DOT_RADIUS} cy={DOT_RADIUS} r={DOT_RADIUS} fill={dotColor} />
            </pattern>
            <clipPath id={`${patternId}-clip`}>
              <rect x={0} y={0} width={w} height={h} rx={0} ry={0} />
            </clipPath>
          </defs>
          <rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill={`url(#${patternId})`}
            clipPath={`url(#${patternId}-clip)`}
          />
        </svg>
      </div>
      {children}
    </div>
  );
}
