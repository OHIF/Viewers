import React, { useMemo } from 'react';
import { useSmartScrollbarLayoutContext } from './SmartScrollbar';
import { computeContiguousRuns, computePixelFilledFromMarked } from './utils';

interface SmartScrollbarFillProps {
  marked: Uint8Array;
  version: number;
  className?: string;
  loadingClassName?: string;
}

export const SmartScrollbarFill = React.memo(function SmartScrollbarFill({
  marked,
  version,
  className,
  loadingClassName,
}: SmartScrollbarFillProps) {
  const { trackHeight, effectiveWidth, fillPadding, isLoading } =
    useSmartScrollbarLayoutContext();

  const runs = useMemo(() => {
    // Render fill in pixel space so the fill never overstates coverage when
    // many indices map into a single pixel row (subpixel heights).
    const pixelCount = trackHeight - fillPadding * 2;
    const pixelFilled = computePixelFilledFromMarked(marked, pixelCount);
    return computeContiguousRuns(pixelFilled);
  }, [marked, version, trackHeight, fillPadding]);

  if (runs.length === 0 || trackHeight === 0) return null;

  const fillAreaTop = fillPadding;
  const activeClass = isLoading && loadingClassName ? loadingClassName : className;

  return (
    <>
      {runs.map(run => {
        const top = fillAreaTop + run.start;
        const height = run.length;

        return (
          <div
            key={`fill-${run.start}`}
            className={`absolute ${activeClass ?? ''}`}
            style={{
              left: 0,
              top,
              width: effectiveWidth,
              height,
              transition: 'width 300ms ease, left 300ms ease',
            }}
          />
        );
      })}
    </>
  );
});
