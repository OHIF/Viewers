import React from 'react';
import classNames from 'classnames';
import { Icons } from '@ohif/ui-next';

const arrowClasses =
  'cursor-pointer flex items-center justify-center shrink-0 text-primary-light active:text-white hover:bg-secondary-light/60 rounded';

type ViewportActionArrowsProps = {
  onArrowsClick: (direction: number) => void;
  className: string;
};

function ViewportActionArrows({ onArrowsClick, className }: ViewportActionArrowsProps) {
  return (
    // The arrows are only visible when hover over the viewport.
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

export default ViewportActionArrows;
