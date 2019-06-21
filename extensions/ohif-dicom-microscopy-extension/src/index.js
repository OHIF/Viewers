import DicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler.js';
import DicomMicroscopyViewport from './DicomMicroscopyViewport.js';

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
