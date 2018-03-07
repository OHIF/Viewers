import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

Template.dialogNonTargetMeasurement.onCreated(() => {
    const instance = Template.instance();

    instance.measurementTypeId = 'nonTarget';

    const config = OHIF.measurements.MeasurementApi.getConfiguration();
    instance.schema = new SimpleSchema({
        location: config.schema.nonTargetLocation,
        response: config.schema.nonTargetResponse
    });

    // Remove the measurement from the collection
    instance.removeMeasurement = () => {
        const measurementApi = instance.viewerData.measurementApi;
        measurementApi.deleteMeasurements('nonTargets', {
            toolItemId: instance.data.measurementData._id
        });

        // Sync the new measurement data with cornerstone tools

        // Commenting this out for now, we need the timepointApi
        //const baseline = timepointApi.baseline();
        //measurementApi.sortMeasurements(baseline.timepointId);

        // Refresh the image with the measurement removed
        cornerstone.updateImage(instance.data.element);
    };

    // Close the current dialog
    instance.closeDialog = () => instance.$('.form-action.close').trigger('click');

    instance.api = {
        // Confirm the deletion of the current non-target measurement
        remove() {
            const dialogSettings = {
                position: instance.data.position,
                title: 'Remove Measurement',
                message: 'Are you sure you want to remove this Non-Target measurement?'
            };

            OHIF.ui.showDialog('dialogConfirm', dialogSettings)
                .then(instance.removeMeasurement);

            instance.closeDialog();
        }
    };
});

Template.dialogNonTargetMeasurement.onRendered(() => {
    const instance = Template.instance();

    const form = instance.$('form').data('component');

    const viewerMain = $(instance.data.element).closest('.viewerMain')[0];
    instance.viewerData = Blaze.getData(viewerMain);

    const measurementApi = instance.viewerData.measurementApi;
    const timepointApi = instance.viewerData.timepointApi;

    const collection = measurementApi.tools[instance.measurementTypeId];

    const measurementData = instance.data.measurementData;

    // Get the current inserted measurement from the collection
    const currentMeasurement = collection.findOne({ _id: measurementData._id });

    // Check if it's a edition or creation
    if (instance.data.edit) {
        // Set the data that is already defined for current measurement
        form.value(currentMeasurement);
    } else {
        // LT-112 Non-target response shall default to non-measurable on baseline, present on follow-up
        const timepoint = timepointApi.study(measurementData.studyInstanceUid)[0];
        const response = timepoint && timepoint.timepointType === 'baseline' ? 'Present' : '';

        // Get a previously inserted Non-target
        const previousMeasurement = collection.findOne({
            _id: { $not: measurementData._id },
            measurementNumber: currentMeasurement.measurementNumber
        });

        // Change the location for current measurement if it's not the first one
        const location = previousMeasurement && previousMeasurement.location;

        // Set the default location and response
        form.value({
            location,
            response
        });

        // Synchronize the measurement number with the one inserted in the collection
        measurementData.measurementNumber = currentMeasurement.measurementNumber;

        // Refresh the image with the measurement number
        cornerstone.updateImage(instance.data.element);
    }

    // Delete the measurement from collection when dialog is closed and not on edit mode
    instance.data.promise.catch(() => {
        if (instance.data.edit) {
            return;
        }

        instance.removeMeasurement();
    });

    // Update the location and response after confirming the dialog data
    instance.data.promise.then(formData => {
        measurementData.response = formData.response;
        measurementData.location = formData.location;

        // Update the response for current measurement
        collection.update({
            _id: measurementData._id,
        }, {
            $set: { response: formData.response }
        });

        // Change the location for all Non-Target measurements with the same measurementNumber
        collection.update({
            measurementNumber: currentMeasurement.measurementNumber
        }, {
            $set: { location: formData.location }
        });
    });
});
