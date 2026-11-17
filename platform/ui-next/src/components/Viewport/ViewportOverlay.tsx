import React from 'react';
import classNames from 'classnames';

import './ViewportOverlay.css';

/**
 * Renders text overlays (top-left, top-right, bottom-left, bottom-right)
 * around the active viewport for metadata or status messages.
 *
 * The parent is responsible for styling offsets.
 */
const classes = {
  // topLeft is flush with the action-corner icon band so fidelity can sit
  // after orientation/dataOverlay (VF-REG-1 / #6256); metadata is pushed
  // below that row in ViewportOverlay.css.
  topLeft: 'overlay-top-left left-viewport',
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
      >
        {topRight}
      </div>
      <div
        data-cy="viewport-overlay-bottom-right"
        className={classNames(overlay, classes.bottomRight)}
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



export { ViewportOverlay };