import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import './ViewportOverlay.css';

/**
 * Renders text overlays (top-left, top-right, bottom-left, bottom-right)
 * around the active viewport for metadata or status messages.
 *
 * The parent is responsible for styling offsets.
 */
const classes = {
  topLeft: 'overlay-top left-viewport',
  topRight: 'overlay-top right-viewport-scrollbar',
  bottomRight: 'overlay-bottom right-viewport-scrollbar',
  bottomLeft: 'overlay-bottom left-viewport',
};

function ViewportOverlay({ topLeft, topRight, bottomRight, bottomLeft, color = 'text-highlight', shadowClass = 'shadow-dark' }) {
  const overlay = 'absolute pointer-events-none viewport-overlay';

  return (
    <div className={classNames(color, 'overlay-text', shadowClass, 'text-base leading-5')}>
      <div
        data-cy="viewport-overlay-top-left"
        className={classNames(overlay, classes.topLeft)}
      >
        {topLeft}
      </div>
      <div
        data-cy="viewport-overlay-top-right"
        className={classNames(overlay, classes.topRight)}
        style={{ transform: 'translateX(9px)' }}
      >
        {topRight}
      </div>
      <div
        data-cy="viewport-overlay-bottom-right"
        className={classNames(overlay, classes.bottomRight)}
        style={{ transform: 'translateX(6px)' }}
      >
        {bottomRight}
      </div>
      <div
        data-cy="viewport-overlay-bottom-left"
        className={classNames(overlay, classes.bottomLeft)}
      >
        {bottomLeft}
      </div>
    </div>
  );
}

ViewportOverlay.propTypes = {
  topLeft: PropTypes.node,
  topRight: PropTypes.node,
  bottomRight: PropTypes.node,
  bottomLeft: PropTypes.node,
  color: PropTypes.string,
  shadowClass: PropTypes.string,
};

export { ViewportOverlay };