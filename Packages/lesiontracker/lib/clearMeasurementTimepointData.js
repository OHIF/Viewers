clearMeasurementTimepointData = function(measurementId, timepointId) {
    var data = Measurements.findOne(measurementId);

    // Check that this Measurement actually contains data for this timepoint
    if (!data || !data.timepoints[timepointId]) {
        return;
    }

    // Clear the Measurement data for this timepoint
    var imageId = data.timepoints[timepointId].imageId;
    var toolType = data.toolType;
    removeToolDataWithMeasurementId(imageId, toolType, measurementId);

    // Update any viewports that are currently displaying this imageId
    var enabledElements = cornerstone.getEnabledElementsByImageId(imageId);
    enabledElements.forEach(function(enabledElement) {
        cornerstone.updateImage(enabledElement.element);
    });

    delete data.timepoints[timepointId];

    if (!Object.keys(data.timepoints).length) {
        Meteor.call('removeMeasurement', measurementId, function(error, response) {
            if (error) {
                log.warn(error);
            }
        });
    } else {
        // Update the Timepoint object of the Measurement document
        Measurements.update(measurementId, {
            $set: {
                timepoints: data.timepoints
            }
        });
    }
};
