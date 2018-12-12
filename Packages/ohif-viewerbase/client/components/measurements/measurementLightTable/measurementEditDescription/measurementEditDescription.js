import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';


Template.measurementEditDescription.onRendered(() => {
    const instance = Template.instance();
    const form = instance.$('form').data('component');
    const measurementData = instance.data.measurementData;
    const collection = OHIF.viewer.measurementApi.tools[measurementData.toolType];
    const currentMeasurement = collection.findOne({ _id: measurementData._id });

    if (currentMeasurement.description) {
        form.value({
            description: currentMeasurement.description
        });
    }

    // Update the description after confirming the dialog data
    instance.data.promise.then(formData => {
        collection.update({
            _id: measurementData._id,
        }, {
            $set: { description: formData.description }
        });
    });
});
