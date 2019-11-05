import OHIFDicomSegSopClassHandler from './OHIFDicomSegSopClassHandler.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'seg',
  getSopClassHandlerModule() {
    return OHIFDicomSegSopClassHandler;
  },
};
