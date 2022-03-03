import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import classnames from 'classnames'
import ConfigPoint from 'config-point'
import ViewportOverlay from '@ohif/ui'

const { CornerstoneViewportOverlay } = ConfigPoint.register({
  CornerstoneViewportOverlay: {
    configBase: 'ViewportOverlay',

    /*
    {
      id: 'Zoom',
      title: 'Zoom:',
      condition: 'isZoomActive',
      value: {configOperation: 'safe', value: 'cornerstone.scale.toFixed(2)+"x" + window.url("...")',
  }
    { isZoomActive && (
    <div className="flex flex-row">
      <span className="mr-1">Zoom:</span>
      <span className="font-light">{scale.toFixed(2)}x</span>
    </div>
  )}
{
  isWwwcActive && (
    <div className="flex flex-row">
      <span className="mr-1">W:</span>
      <span className="ml-1 mr-2 font-light">
        {windowWidth.toFixed(0)}
      </span>
      <span className="mr-1">L:</span>
      <span className="ml-1 font-light">{windowCenter.toFixed(0)}</span>
    </div>
  )
}
  </div >
  <div
    data-cy={'viewport-overlay-top-right'}
    className={classnames(overlay, topRight)}
  >
    {stackSize > 1 && (
      <div className="flex flex-row">
        <span className="mr-1">I:</span>
        <span className="font-light">
          {`${instanceNumber} (${imageIndex}/${stackSize})`}
        </span>
      </div>
    )}
  </div>
  */

  }
});


export default CornerstoneViewportOverlay.generateFromConfig(CornerstoneViewportOverlay);
