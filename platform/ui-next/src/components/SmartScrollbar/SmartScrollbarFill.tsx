import React, { useMemo } from 'react';
import { useSmartScrollbarLayoutContext } from './SmartScrollbar';
import { getContiguousRuns } from './utils';

interface SmartScrollbarFillProps {
  marked: Set<number>;
  className?: string;
  loadingClassName?: string;
}

export const SmartScrollbarFill = React.memo(function SmartScrollbarFill({
  marked,
  className,
  loadingClassName,
}: SmartScrollbarFillProps) {
  const { total, trackHeight, effectiveWidth, fillPadding, isLoading } =
    useSmartScrollbarLayoutContext();

  // marked is a mutated Set (same reference), so depend on .size to bust memo
  const runs = useMemo(
    () => getContiguousRuns(marked, total),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marked.size, total]
  );

  if (runs.length === 0 || trackHeight === 0) return null;

  const fillAreaTop = fillPadding;
  const fillAreaHeight = trackHeight - fillPadding * 2;
  const activeClass = isLoading && loadingClassName ? loadingClassName : className;
  return (
    <>
      {runs.map(run => {
        const top = fillAreaTop + (run.start / total) * fillAreaHeight;
        const height = (run.length / total) * fillAreaHeight;

        return (
          <div
            key={`fill-${run.start}`}
            className={`absolute ${activeClass ?? ''}`}
            style={{
              left: 0,
              top,
              width: effectiveWidth,
              height: Math.max(1, height),
              transition: 'width 300ms ease, left 300ms ease',
            }}
          />
        );
      })}
    </>
  );
});
