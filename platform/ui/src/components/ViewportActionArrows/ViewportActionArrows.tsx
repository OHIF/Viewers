import React from 'react';
import Icon from '../Icon';
import classNames from 'classnames';

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
        <Icon
          name="prev-arrow"
          onClick={() => onArrowsClick(-1)}
        />
      </div>
      <div className={arrowClasses}>
        <Icon
          name="next-arrow"
          onClick={() => onArrowsClick(1)}
        />
      </div>
    </div>
  );
}

export default ViewportActionArrows;
