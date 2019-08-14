import OHIFDicomHtmlSopClassHandler from './OHIFDicomHtmlSopClassHandler.js';
import OHIFDicomHtmlViewport from './OHIFDicomHtmlViewport.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'html',

  getViewportModule() {
    return OHIFDicomHtmlViewport;
  },
  getSopClassHandlerModule() {
    return OHIFDicomHtmlSopClassHandler;
  }
};
