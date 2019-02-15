import OHIFDicomHtmlViewport from './OHIFDicomHtmlViewport.js';
import OHIFDicomHtmlSopClassHandler from './OHIFDicomHtmlSopClassHandler.js';

export default class OHIFDicomHtmlExtension {
  /**
   * Extension ID is a unique id, might be used for namespacing extension specific redux actions/reducers (?)
   */
  getExtensionId() {
    return 'html';
  }

  getViewportModule() {
    return OHIFDicomHtmlViewport;
  }

  getSopClassHandler() {
    return OHIFDicomHtmlSopClassHandler;
  }

  getPanelModuleDefinition() {
    return null;
  }

  getToolbarModuleDefinition() {
    return null;
  }
}
