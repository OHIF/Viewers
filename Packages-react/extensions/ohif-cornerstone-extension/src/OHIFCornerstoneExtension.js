import OHIFCornerstoneViewport from './OHIFCornerstoneViewport.js';

export default class OHIFCornerstoneExtension {
  /**
   * Extension ID is a unique id, might be used for namespacing extension specific redux actions/reducers (?)
   */
  getExtensionId() {
    return 'cornerstone';
  }

  getViewportModule() {
    return OHIFCornerstoneViewport;
  }

  getSopClassHandler() {
    return null;
  }

  getPanelModule() {
    return null;
  }

  getToolbarModule() {
    return null;
  }
}
