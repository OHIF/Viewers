import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { _ } from 'meteor/underscore';
import { FieldLesionLocation, FieldLesionLocationResponse } from 'meteor/ohif:lesiontracker/both/schema/fields';

Template.dialogNonTargetMeasurement.onCreated(() => {
    const instance = Template.instance();

    instance.schema = new SimpleSchema({
        location: FieldLesionLocation,
        response: FieldLesionLocationResponse
    });
});

Template.dialogNonTargetMeasurement.onRendered(() => {
    const instance = Template.instance();

    const element = instance.data.eventData.element;

    const form = instance.$('form').data('component');

    const viewerMain = $(element).closest('.viewerMain')[0];
    const viewerData = Blaze.getData(viewerMain);
    console.warn('>>>>dialogData/viewerData', instance.data, viewerData);

    const measurementApi = viewerData.measurementApi;

    const measurementTypeId = 'nonTargets';
    const measurementData = instance.data.measurementData;
    const collection = measurementApi[measurementTypeId];

    // Get the current inserted measurement from the collection
    const currentMeasurement = collection.findOne({
        _id: measurementData._id
    });

    // Set the data that is already defined
    form.value(currentMeasurement);

    // Synchronize the measurement number with the one inserted in the collection
    measurementData.measurementNumber = currentMeasurement.measurementNumber;

    // Refresh the image with the measurement number
    cornerstone.updateImage(element);

    // Delete the measurement from collection when dialog is closed and not on edit mode
    instance.data.promise.catch(() => {
        if (instance.data.edit) {
            return;
        }

        viewerData.measurementApi.deleteMeasurements('nonTargets', {
            _id: measurementData._id
        });

        // Refresh the image with the measurement removed
        cornerstone.updateImage(element);
    });

    // Update the location and response after confirming the dialog data
    instance.data.promise.then(formData => {
        collection.update({
            _id: measurementData._id,
        }, {
            $set: {
                location: formData.location,
                response: formData.response
            }
        });
    });

});
