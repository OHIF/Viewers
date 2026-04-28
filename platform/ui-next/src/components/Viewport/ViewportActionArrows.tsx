import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Icons } from '@ohif/ui-next';

const arrowClasses =
  'cursor-pointer flex items-center justify-center shrink-0 text-primary active:text-foreground hover:bg-primary/30 rounded';

/**
 * A small set of left/right arrow icons for stepping through slices or series.
 */
function ViewportActionArrows({ onArrowsClick, className }) {
  return (
    <div
      data-cy="viewport-action-arrows"
      className={classNames(className, 'flex')}
    >
      <div
        data-cy="viewport-action-arrows-left"
        className={arrowClasses}
      >
        <Icons.ArrowLeftBold onClick={() => onArrowsClick(-1)} />
      </div>
      <div
        data-cy="viewport-action-arrows-right"
        className={arrowClasses}
      >
        <Icons.ArrowRightBold onClick={() => onArrowsClick(1)} />
      </div>
    </div>
  );
}

ViewportActionArrows.propTypes = {
  onArrowsClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export { ViewportActionArrows };
