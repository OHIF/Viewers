import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { _ } from 'meteor/underscore';
import { FieldLesionLocation, FieldLesionLocationResponse } from 'meteor/ohif:lesiontracker/both/schema/fields';

Template.dialogNonTargetMeasurement.onCreated(() => {
    const instance = Template.instance();

    instance.schema = new SimpleSchema({
        location: FieldLesionLocation,
        response: FieldLesionLocationResponse,
        measurementNumber: {
            type: Number
        }
    });
});

Template.dialogNonTargetMeasurement.onRendered(() => {
    const instance = Template.instance();

    const form = instance.$('form').data('component');

    const viewerMain = $(instance.data.eventData.element).closest('.viewerMain')[0];
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

    // Synchronize the measurement number with the one inserted in the collection
    measurementData.measurementNumber = currentMeasurement.measurementNumber;

    // Delete the measurement if dialog is closed
    instance.data.promise.catch(() => {
        viewerData.measurementApi.deleteMeasurements('nonTargets', {
            _id: measurementData._id
        });

        // Repaint the images on all viewports without the removed measurements
        _.each($('.imageViewerViewport'), element => cornerstone.updateImage(element));
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

    // Inject the measurement number in form data to enable the tool from getting the value
    form.value({
        measurementNumber: currentMeasurement.measurementNumber
    });

});
