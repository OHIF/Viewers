import { OHIF } from 'meteor/ohif:core';

/**
 * Extensible method to trigger unsaved changes on the active timepoint
 *
 * @param {String} subpath - The unsaved changes subpath that will come after the timepoint ID
 */
OHIF.measurements.triggerTimepointUnsavedChanges = (subpath='changed') => {
    const basePath = 'viewer.studyViewer.measurements';
    const activeTimepoint = OHIF.measurements.getActiveTimepoint();
    if (!activeTimepoint) return;
    const { timepointId } = activeTimepoint;
    const timepointPath = timepointId ? `.${timepointId}` : '';
    OHIF.ui.unsavedChanges.set(`${basePath}${timepointPath}.${subpath}`);
};
