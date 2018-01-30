import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.saveMeasurements = (measurementApi, timepointId) => {
    const { unsavedChanges, notifications, showDialog } = OHIF.ui;
    const basePath = `viewer.studyViewer.measurements.${timepointId}`;

    // Stop here if there are nonconformities in the timepoints
    const nonconformities = OHIF.viewer.conformanceCriteria.nonconformities.get();
    if (nonconformities.length) return;

    // Stop here if there were no changes to the timepoint
    if (unsavedChanges.probe(basePath) === 0) return;

    // Clear unsaved changes state and display success message
    const successHandler = () => {
        unsavedChanges.clear(basePath, true);
        notifications.success({ text: 'The measurement data was successfully saved' });
    };

    // Display the error messages
    const errorHandler = data => {
        showDialog('dialogInfo', Object.assign({ class: 'themed' }, data));
    };

    // Call the storage method and display a loading overlay
    const promise = measurementApi.storeMeasurements(timepointId);
    promise.then(successHandler).catch(errorHandler);
    showDialog('dialogLoading', {
        promise,
        text: 'Saving measurement data'
    });

    // Return the save promise
    return promise;
};
