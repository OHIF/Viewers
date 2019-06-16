import OHIFDicomPDFSopClassHandler from './OHIFDicomPDFSopClassHandler.js';
import OHIFDicomPDFViewport from './OHIFDicomPDFViewport.js';

export default class OHIFDicomPDFExtension {
  /**
   * Extension ID is a unique id, might be used for namespacing extension specific redux actions/reducers (?)
   */
  getExtensionId() {
    return 'pdf';
  }

  getViewportModule() {
    return OHIFDicomPDFViewport;
  }

  getSopClassHandler() {
    return OHIFDicomPDFSopClassHandler;
  }
}
