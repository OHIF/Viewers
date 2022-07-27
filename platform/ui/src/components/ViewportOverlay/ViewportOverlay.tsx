import React from 'react';
import classnames from 'classnames';

import './ViewportOverlay.css';

const ViewportOverlay = props => {
  const topLeft = 'top-viewport left-viewport';
  const topRight = 'top-viewport right-viewport-scrollbar';
  const bottomRight = 'bottom-viewport right-viewport-scrollbar';
  const bottomLeft = 'bottom-viewport left-viewport';
  const overlay = 'absolute pointer-events-none';

  return (
    <div className="text-primary-light">
      <div
        data-cy={'viewport-overlay-top-left'}
        className={classnames(overlay, topLeft)}
      >
        {props.topLeft}
      </div>
      <div
        data-cy={'viewport-overlay-top-right'}
        className={classnames(overlay, topRight)}
      >
        {props.topRight}
      </div>
      <div
        data-cy={'viewport-overlay-bottom-right'}
        className={classnames(overlay, bottomRight)}
      >
        {props.bottomRight}
      </div>
      <div
        data-cy={'viewport-overlay-bottom-left'}
        className={classnames(overlay, bottomLeft)}
      >
        {props.bottomLeft}
      </div>
    </div>
  );
};

export default ViewportOverlay;
