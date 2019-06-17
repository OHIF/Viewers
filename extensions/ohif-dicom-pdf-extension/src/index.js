import OHIFDicomPDFSopClassHandler from './OHIFDicomPDFSopClassHandler.js';
import OHIFDicomPDFViewport from './OHIFDicomPDFViewport.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'pdf',

  getViewportModule() {
    return OHIFDicomPDFViewport;
  },
  getSopClassHandlerModule() {
    return OHIFDicomPDFSopClassHandler;
  }
};
