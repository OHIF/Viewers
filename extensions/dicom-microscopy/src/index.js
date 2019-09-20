import asyncComponent from './asyncComponent.js';
import DicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler.js';

const DicomMicroscopyViewport = asyncComponent(() =>
  import(
    /* webpackChunkName: "DicomMicroscopyViewport" */ './DicomMicroscopyViewport.js'
  )
);

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'microscopy',

  getViewportModule() {
    return DicomMicroscopyViewport;
  },
  getSopClassHandlerModule() {
    return DicomMicroscopySopClassHandler;
  },
};
