import asyncComponent from './asyncComponent.js';
import OHIFDicomPDFSopClassHandler from './OHIFDicomPDFSopClassHandler.js';

const ConnectedOHIFDicomPDFViewport = asyncComponent(() =>
  import(
    /* webpackChunkName: "ConnectedOHIFDicomPDFViewport" */ './ConnectedOHIFDicomPDFViewer'
  )
);

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
