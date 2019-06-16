import DicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler.js';
import DicomMicroscopyViewport from './DicomMicroscopyViewport.js';

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

  getSopClassHandlerModule() {
    return DicomMicroscopySopClassHandler;
  }
}
