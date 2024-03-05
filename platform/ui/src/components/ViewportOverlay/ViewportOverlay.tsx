import React from 'react';
import classnames from 'classnames';

import './ViewportOverlay.css';

const classes = {
  topLeft: 'top-viewport left-viewport',
  topRight: 'top-viewport right-viewport-scrollbar',
  bottomRight: 'bottom-viewport right-viewport-scrollbar',
  bottomLeft: 'bottom-viewport left-viewport',
};

type ViewportOverlayProps = {
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
    <div className={color}>
      <div
        data-cy={'viewport-overlay-top-left'}
        className={classnames(overlay, classes.topLeft)}
      >
        {topLeft}
      </div>
      <div
        data-cy={'viewport-overlay-top-right'}
        className={classnames(overlay, classes.topRight)}
      >
        {topRight}
      </div>
      <div
        data-cy={'viewport-overlay-bottom-right'}
        className={classnames(overlay, classes.bottomRight)}
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
