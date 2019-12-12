import asyncComponent from './asyncComponent.js';
import OHIFDicomHtmlSopClassHandler from './OHIFDicomHtmlSopClassHandler.js';

const OHIFDicomHtmlViewport = asyncComponent(() =>
  import(
    /* webpackChunkName: "OHIFDicomHtmlViewport" */ './OHIFDicomHtmlViewport.js'
  )
);

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
  },
};
