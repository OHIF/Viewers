import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';
import { DICOMWebServer as dicomSchema } from 'meteor/ohif:servers/both/schema/servers.js';
import { DIMSEServer as dimseSchema } from 'meteor/ohif:servers/both/schema/servers.js';

Template.serverInformationForm.onCreated(() => {
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
            Meteor.call('serverSave', formData, function(error) {
                if (error) {
                    // TODO: check for errors: not-authorized, data-write
                    OHIF.log.error(error);
                }

                instance.data.resetState();
            });
        }
    };

    instance.currentSchema = new ReactiveVar(dicomSchema);
});

Template.serverInformationForm.onRendered(() => {
    const instance = Template.instance();

    instance.data.$form = instance.$('form').first();
    instance.data.form = instance.data.$form.data('component');

    // Handle the server type
    instance.autorun(() => {
        // Get the server type component
        const typeComponent = instance.$('[data-key=type] :input').data('component');

        // Run this computation every time the user change the server type
        typeComponent.depend();

        // Get the current server type value
        const type = typeComponent.value();

        // Set the serverType reactive value
        instance.data.serverType.set(type);

        // Change the schema based on the selected server type
        if (type === 'dimse') {
            instance.currentSchema.set(dimseSchema);
        } else {
            instance.currentSchema.set(dicomSchema);
        }
    });

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
