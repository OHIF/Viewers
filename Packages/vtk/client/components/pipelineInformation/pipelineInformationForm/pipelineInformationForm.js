import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';
import { PipelineSchema } from 'meteor/gtajesgenga:vtk/both/schema/Pipelines.js';

Template.pipelineInformationForm.onCreated(() => {
    const instance = Template.instance();

    instance.data.api = {
        save() {
            // Stop here if the form validation fails
            if (!instance.data.form.validate()) {
                return;
            }

            // Get the current form data
            const formData = instance.data.form.value();

            // Call the save method
            Meteor.call('pipelineSave', formData, function(error) {
                if (error) {
                    // TODO: check for errors: not-authorized, data-write
                    OHIF.log.error(error);
                }

                instance.data.resetState();
            });
        }
    };

    instance.currentSchema = new ReactiveVar(PipelineSchema);
});

Template.pipelineInformationForm.onRendered(() => {
    const instance = Template.instance();

    instance.data.$form = instance.$('form').first();
    instance.data.form = instance.data.$form.data('component');

    // Handle the form mode (edit or add)
    instance.autorun(() => {
        const mode = instance.data.mode.get();

        // Check if it is on edit mode and load the saved data
        if (mode === 'edit') {
            const data = instance.data.currentItem.get();
            instance.data.form.value(data);
        }
    });
});
