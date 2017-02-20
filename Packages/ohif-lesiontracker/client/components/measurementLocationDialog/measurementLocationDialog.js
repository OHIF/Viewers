// Note: This component is not in use, but the functions below are still being used. This
// is in the process of being moved into another location
import { OHIF } from 'meteor/ohif:core';

Template.measurementLocationDialog.onCreated(() => {
    const instance = Template.instance();
    const measurementApi = instance.data.measurementApi;

    const toggleLabel = (measurementData, eventData, doneCallback) => {
        delete measurementData.isCreating;

        if (OHIF.lesiontracker.removeMeasurementIfInvalid(measurementData, eventData)) {
            return;
        }

        const getHandlePosition = key => _.pick(measurementData.handles[key], ['x', 'y']);
        const start = getHandlePosition('start');
        const end = getHandlePosition('end');
        const getDirection = axis => start[axis] < end[axis] ? 1 : -1;
        const position = OHIF.cornerstone.pixelToPage(eventData.element, end);

        OHIF.measurements.toggleLabelButton({
            instance,
            measurement: measurementData,
            element: eventData.element,
            measurementApi,
            position: position,
            direction: {
                x: getDirection('x'),
                y: getDirection('y')
            }
        });
    };

    const callbackConfig = {
        // TODO: Check the position for these, the Add Label button position seems very awkward
        getMeasurementLocationCallback: toggleLabel,
        changeMeasurementLocationCallback: toggleLabel,
    };

    // TODO: Reconcile this with the configuration in toolManager
    // it would be better to have this all in one place.
    const bidirectionalConfig = cornerstoneTools.bidirectional.getConfiguration();
    const config = {
        ...bidirectionalConfig,
        ...callbackConfig
    };

    cornerstoneTools.bidirectional.setConfiguration(config);

    // Set CR-Tool, UN-Tool, EX-Tool configurations
    cornerstoneTools.targetCR.setConfiguration(config);
    cornerstoneTools.targetUN.setConfiguration(config);
    cornerstoneTools.targetEX.setConfiguration(config);

});

// Note: None of these events work anymore
Template.measurementLocationDialog.events({
    'click #removeMeasurement'() {
        const measurementData = Template.measurementLocationDialog.measurementData;
        const doneCallback = Template.measurementLocationDialog.doneCallback;
        const dialog = Template.measurementLocationDialog.dialog;

        const options = {
            keyPressAllowed: false,
            title: 'Remove measurement?',
            text: 'Are you sure you would like to remove the entire measurement?'
        };

        showConfirmDialog(function() {
            if (doneCallback && typeof doneCallback === 'function') {
                const deleteTool = true;
                doneCallback(measurementData, deleteTool);
            }
        }, options);

        closeHandler(dialog);
    },

    'click #convertToNonTarget'() {
        const measurementData = Template.measurementLocationDialog.measurementData;
        const dialog = Template.measurementLocationDialog.dialog;

        const instance = Template.instance();
        const measurementApi = instance.data.measurementApi;
        OHIF.measurementTracker.convertToNonTarget(measurementApi, measurementData);

        closeHandler(dialog);
    }
});
