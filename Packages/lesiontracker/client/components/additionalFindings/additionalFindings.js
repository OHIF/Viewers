import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { schema as AdditionalFindingsSchema } from 'meteor/lesiontracker/both/schema/additionalFindings';

Template.additionalFindings.onCreated(() => {
    const instance = Template.instance();

    instance.currentSchema = AdditionalFindingsSchema;
});

Template.additionalFindings.onRendered(() => {
    const instance = Template.instance();

    // Get the form component
    const form = instance.$('form:first').data('component');

    const currentTimepointId = instance.data.currentTimepointId;
    if (!currentTimepointId) {
        console.warn('Case has no timepointId');
        return;
    }

    const additionalFindings = AdditionalFindings.findOne({
        timepointId: currentTimepointId
    });

    if (additionalFindings) {
        instance.id = additionalFindings._id;
        form.value(additionalFindings);
    } else {
        const defaultData = instance.currentSchema.clean({});
        form.value(defaultData);

        // Include patientId and timepointId
        defaultData.patientId = Session.get('patientId');
        defaultData.timepointId = currentTimepointId;

        // TODO: [design] Turn this into a Meteor Call to insert it on the server
        instance.id = AdditionalFindings.insert(defaultData);
    }

    instance.autorun(computation => {
        // Run this computation everytime the form data is changed
        form.depend();

        // Stop here if it's the computation's first run
        if (computation.firstRun) {
            return;
        }

        // Get the form data for AdditionalFindings
        let formData = form.value();

        // TODO: [design] Turn this into a Meteor Call to update it on the server
        AdditionalFindings.update(instance.id, {
            $set: formData
        });
    });
});
