import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { DICOMWebServer as dicomSchema } from 'meteor/worklist/both/schema';
import { DIMSEServer as dimseSchema } from 'meteor/worklist/both/schema';

Template.serverInformationForm.onCreated(() => {
    const instance = Template.instance();

    instance.currentSchema = new ReactiveVar(dicomSchema);
});

Template.serverInformationForm.onRendered(() => {
    const instance = Template.instance();

    instance.data.$form = instance.$('form');

    instance.autorun(() => {
        const typeComponent = instance.$('[data-key=type]').data('component');
        typeComponent.changeObserver.depend();
        instance.data.serverType.set(typeComponent.value());
    });

    instance.autorun(() => {
        const mode = instance.data.mode.get();
        if (mode === 'edit') {
            var data = instance.data.currentItem.get();
            FormUtils.setFormData(instance.data.$form, data);
        }
    });
});

Template.serverInformationForm.events({
    submit(event, instance) {
        event.preventDefault();
        var formData = FormUtils.getFormData(instance.data.$form);
        Meteor.call('serverSave', formData, function(error) {
            if (error) {
                // TODO: check for errors: not-authorized, data-write
                console.log('>>>>ERROR', error);
            }

            instance.data.resetState();
        });
    }
});
