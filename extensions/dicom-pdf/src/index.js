import asyncComponent from './asyncComponent.js';
import OHIFDicomPDFSopClassHandler from './OHIFDicomPDFSopClassHandler.js';

const ConnectedOHIFDicomPDFViewer = asyncComponent(() =>
  import(
    /* webpackChunkName: "ConnectedOHIFDicomPDFViewer" */ './ConnectedOHIFDicomPDFViewer'
  )
);

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'pdf',
  getViewportModule() {
    return ConnectedOHIFDicomPDFViewer;
  },
  getSopClassHandlerModule() {
    return OHIFDicomPDFSopClassHandler;
  },
};
