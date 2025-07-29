import React from 'react';
import classNames from 'classnames';

import { Icons } from '@ohif/ui-next';

const arrowClasses =
  'cursor-pointer flex items-center justify-center shrink-0 text-highlight active:text-foreground hover:bg-primary/30 rounded';

interface ViewportActionArrowsProps {
  onArrowsClick(...args: unknown[]): unknown;
  className?: string;
}

/**
 * A small set of left/right arrow icons for stepping through slices or series.
 */
function ViewportActionArrows({
  onArrowsClick,
  className
}: ViewportActionArrowsProps) {
  return (
    <div className={classNames(className, 'flex')}>
      <div className={arrowClasses}>
        <Icons.ArrowLeftBold onClick={() => onArrowsClick(-1)} />
      </div>
      <div className={arrowClasses}>
        <Icons.ArrowRightBold onClick={() => onArrowsClick(1)} />
      </div>
    </div>
  );
}

export { ViewportActionArrows };
