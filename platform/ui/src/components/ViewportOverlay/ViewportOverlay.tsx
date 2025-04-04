import React from 'react';
import classnames from 'classnames';

import './ViewportOverlay.css';

// The overlay-top and overlay-bottom classes are explicitly needed to offset
// the overlays (i.e. via absolute positioning) such the ViewportActionCorners
// have space for its child components.
// ToDo: offset the ViewportOverlay automatically via css to account for the
// space needed for ViewportActionCorners.
const classes = {
  topLeft: 'overlay-top left-viewport',
  topRight: 'overlay-top right-viewport-scrollbar',
  bottomRight: 'overlay-bottom right-viewport-scrollbar',
  bottomLeft: 'overlay-bottom left-viewport',
};

export type ViewportOverlayProps = {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  color?: string;
};

const ViewportOverlay = ({
  topLeft,
  topRight,
  bottomRight,
  bottomLeft,
  color = 'text-primary-light',
}: ViewportOverlayProps) => {
  const overlay = 'absolute pointer-events-none viewport-overlay';
  return (
    <div
      className={classnames(
        color ? color : 'text-aqua-pale',
        'text-[13px]',
        'leading-5',
        'overlay-text'
      )}
    >
      <div
        data-cy={'viewport-overlay-top-left'}
        className={classnames(overlay, classes.topLeft)}
      >
        {topLeft}
      </div>
      <div
        data-cy={'viewport-overlay-top-right'}
        className={classnames(overlay, classes.topRight)}
        style={{ transform: 'translateX(-8px)' }} // shift right side overlays by 4px for better alignment with ViewportActionCorners' icons
      >
        {topRight}
      </div>
      <div
        data-cy={'viewport-overlay-bottom-right'}
        className={classnames(overlay, classes.bottomRight)}
        style={{ transform: 'translateX(-8px)' }} // shift right side overlays by 4px for better alignment with ViewportActionCorners' icons
      >
        {bottomRight}
      </div>
      <div
        data-cy={'viewport-overlay-bottom-left'}
        className={classnames(overlay, classes.bottomLeft)}
      >
        {bottomLeft}
      </div>
    </div>
  );
};

export default ViewportOverlay;
