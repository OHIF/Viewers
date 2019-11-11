import OHIFDicomPDFSopClassHandler from './OHIFDicomPDFSopClassHandler.js';
import ConnectedOHIFDicomPDFViewport from './ConnectedOHIFDicomPDFViewer.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'pdf',

  getViewportModule() {
    return ConnectedOHIFDicomPDFViewport;
  },
  getSopClassHandlerModule() {
    return OHIFDicomPDFSopClassHandler;
  },
};
