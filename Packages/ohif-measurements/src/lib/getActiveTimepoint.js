import { OHIF } from 'ohif-core';

/**
 * Extensible method to get the timepoint of the active viewport
 *
 * @returns {Object} - Timepoint data for the active viewport
 */
OHIF.measurements.getActiveTimepoint = () => {
    const activeViewportIndex = window.store.getState().viewports.activeViewport;
    const { studyInstanceUid } = OHIF.viewer.layoutManager.viewportData[activeViewportIndex];
    return OHIF.viewer.timepointApi.study(studyInstanceUid)[0];
};
