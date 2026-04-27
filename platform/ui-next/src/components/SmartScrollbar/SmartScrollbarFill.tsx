import React, { useMemo } from 'react';
import { useSmartScrollbarLayoutContext } from './SmartScrollbar';
import { computeContiguousRuns, computePixelFilledFromMarked } from './utils';

interface SmartScrollbarFillProps {
  marked: Uint8Array;
  /**
   * Change token that MUST be bumped when the contents of `marked` change while
   * the `marked` array reference stays the same (in-place mutation).
   *
   * Recommended: manage `marked` + `version` together via `useByteArray()`.
   */
  version: number;
  /** Fill color class. Defaults to `'bg-neutral/25'`. Override to customize (e.g. `'bg-primary/35'` for a viewed fill). */
  className?: string;
  /** Fill color class used while the scrollbar is in a loading state. Defaults to `'bg-neutral/50'`. */
  loadingClassName?: string;
}

export const SmartScrollbarFill = React.memo(function SmartScrollbarFill({
  marked,
  version,
  className = 'bg-neutral/25',
  loadingClassName = 'bg-neutral/50',
}: SmartScrollbarFillProps) {
  const { trackHeight, effectiveWidth, fillPadding, isLoading } = useSmartScrollbarLayoutContext();

  const runs = useMemo(() => {
    // Render fill in pixel space so the fill never overstates coverage when
    // many indices map into a single pixel row (subpixel heights).
    const pixelCount = Math.max(0, Math.floor(trackHeight - fillPadding * 2));
    const pixelFilled = computePixelFilledFromMarked(marked, pixelCount);
    return computeContiguousRuns(pixelFilled);
  }, [marked, version, trackHeight, fillPadding]);

  if (runs.length === 0 || trackHeight === 0) return null;

  const fillAreaTop = fillPadding;
  const activeClass = isLoading && loadingClassName ? loadingClassName : className;

  return (
    <>
      {runs.map((run, index) => {
        const top = fillAreaTop + run.start;
        const height = run.length;

        return (
          <div
            key={index}
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
