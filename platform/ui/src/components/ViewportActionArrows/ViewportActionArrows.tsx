import React from 'react';
import Icon from '../Icon';

const arrowClasses =
  'cursor-pointer flex items-center justify-center shrink-0 text-primary-light active:text-white hover:bg-secondary-light/60';

type ViewportActionArrowsProps = {
  onArrowsClick: (arrow: string) => void;
};

function ViewportActionArrows({ onArrowsClick }: ViewportActionArrowsProps) {
  return (
    <div className="invisible flex group-hover:visible">
      <div className={arrowClasses}>
        <Icon
          name="prev-arrow"
          onClick={() => onArrowsClick('left')}
        />
      </div>
      <div className={arrowClasses}>
        <Icon
          name="next-arrow"
          onClick={() => onArrowsClick('right')}
        />
      </div>
    </div>
  );
}

export default ViewportActionArrows;
