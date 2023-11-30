import React from 'react';
import Icon from '../Icon';

const arrowClasses =
  'cursor-pointer flex items-center justify-center shrink-0 text-primary-light active:text-white hover:bg-secondary-light/60 rounded';

type ViewportActionArrowsProps = {
  onArrowsClick: (direction: number) => void;
};

function ViewportActionArrows({ onArrowsClick }: ViewportActionArrowsProps) {
  return (
    // The arrows are only visible when hover over the viewport.
    <div className="invisible flex group-hover:visible">
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
