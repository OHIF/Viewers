import { OHIF } from 'ohif-core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

OHIF.measurements.clearCornerstoneToolState = () => {
    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState({});
};
