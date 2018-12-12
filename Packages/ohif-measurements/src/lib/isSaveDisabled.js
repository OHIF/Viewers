import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.isSaveDisabled = timepointId => {
    const basePath = `viewer.studyViewer.measurements.${timepointId}`;

    // Get the timepoint object
    const timepoint = OHIF.viewer.timepointApi.timepoints.findOne({ timepointId });

    // Check if the timepoint is locked
    let isLocked = (timepoint && timepoint.isLocked);
    if (typeof isLocked === 'undefined') {
        isLocked = true;
    }

    // Check if the given timepoint suffered changes
    const hasChanges = OHIF.ui.unsavedChanges.probe(basePath) !== 0;

    // Check if the given timepoint has nonconformities
    const nonconformities = OHIF.viewer.conformanceCriteria.nonconformities.get();
    const hasNonconformities = nonconformities && !!nonconformities.length;

    // Prevent saving if timepoint is locked, has no changes or has nonconformities
    return isLocked || !hasChanges || hasNonconformities;
};
