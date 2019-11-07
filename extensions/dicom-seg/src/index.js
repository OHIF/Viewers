import OHIFDicomSegSopClassHandler from './OHIFDicomSegSopClassHandler.js';

// TODO: If a vtkjs viewport or cornerstone viewport is open,
// Add a drop down to select which segmentation to display. Fetch and cache if
// its not available yet.

// TODO: Should all tools for cornerstone/vtkjs live inside this extension?
// TODO: Should all segmentation UI live in this extension?

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'seg',
  getSopClassHandlerModule() {
    return OHIFDicomSegSopClassHandler;
  },
};
