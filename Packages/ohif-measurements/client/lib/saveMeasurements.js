import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.saveMeasurements = (measurementApi, timepointId) => {
    const { unsavedChanges, notifications, showDialog } = OHIF.ui;
    const basePath = `viewer.studyViewer.measurements.${timepointId}`;

    // Prevent saving if it's disabled
    if (OHIF.measurements.isSaveDisabled(timepointId)) {
        return;
    }

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
