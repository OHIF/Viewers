import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';

/**
 * Extensible method to get the timepoint of the active viewport
 *
 * @returns {Object} - Timepoint data for the active viewport
 */
OHIF.measurements.getActiveTimepoint = () => {
    const activeViewportIndex = Session.get('activeViewport');
    const { studyInstanceUid } = OHIF.viewerbase.layoutManager.viewportData[activeViewportIndex];
    return OHIF.viewer.timepointApi.study(studyInstanceUid)[0];
};
