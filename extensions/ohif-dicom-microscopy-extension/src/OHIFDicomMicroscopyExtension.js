import DicomMicroscopyViewport from './DicomMicroscopyViewport.js';
import DicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler.js';

export default class OHIFDicomMicroscopyExtension {
  /**
   * Extension ID is a unique id, might be used for namespacing extension specific redux actions/reducers (?)
   */
  getExtensionId() {
    return 'microscopy';
  }

  getViewportModule() {
    return DicomMicroscopyViewport;
  }

  getSopClassHandler() {
    return DicomMicroscopySopClassHandler;
  }

  getPanelModule() {
    return null;
  }

  getToolbarModule() {
    return null;
  }
}
