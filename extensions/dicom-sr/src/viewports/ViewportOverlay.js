import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import classnames from 'classnames';

const ViewportOverlay = ({
  imageId,
  scale,
  windowWidth,
  windowCenter,
  imageIndex,
  stackSize,
  activeTools,
}) => {
  const topLeft = 'top-viewport left-viewport';
  const topRight = 'top-viewport right-viewport-scrollbar';
  const bottomRight = 'bottom-viewport right-viewport-scrollbar';
  const bottomLeft = 'bottom-viewport left-viewport';
  const overlay = 'absolute pointer-events-none';

  const isZoomActive = activeTools.includes('Zoom');
  const isWwwcActive = activeTools.includes('Wwwc');

  if (!imageId) {
    return null;
  }

  const generalImageModule =
    cornerstone.metaData.get('generalImageModule', imageId) || {};
  const { instanceNumber } = generalImageModule;

  return (
    <div className="text-primary-light">
      <div className={classnames(overlay, topLeft)}>
        {isZoomActive && (
          <div className="flex flex-row">
            <span className="mr-1">Zoom:</span>
            <span className="font-light">{scale.toFixed(2)}x</span>
          </div>
        )}
        {isWwwcActive && (
          <div className="flex flex-row">
            <span className="mr-1">W:</span>
            <span className="ml-1 mr-2 font-light">
              {windowWidth.toFixed(0)}
            </span>
            <span className="mr-1">L:</span>
            <span className="ml-1 font-light">{windowCenter.toFixed(0)}</span>
          </div>
        )}
      </div>
      <div className={classnames(overlay, topRight)}>
        {stackSize > 1 && (
          <div className="flex flex-row">
            <span className="mr-1">I:</span>
            <span className="font-light">
              {`${instanceNumber} (${imageIndex}/${stackSize})`}
            </span>
          </div>
        )}
      </div>
      <div className={classnames(overlay, bottomRight)}></div>
      <div className={classnames(overlay, bottomLeft)}></div>
    </div>
  );
};

ViewportOverlay.defaultProps = {
  stackSize: 99999,
};

ViewportOverlay.propTypes = {
  scale: PropTypes.number.isRequired,
  windowWidth: PropTypes.number.isRequired,
  windowCenter: PropTypes.number.isRequired,
  imageId: PropTypes.string.isRequired,
  imageIndex: PropTypes.number.isRequired,
  stackSize: PropTypes.number.isRequired,
  activeTools: PropTypes.arrayOf(PropTypes.string),
};

ViewportOverlay.defaultProps = {
  activeTools: [],
};

export default ViewportOverlay;
