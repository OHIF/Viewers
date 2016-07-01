import { Template } from 'meteor/templating';

import './radioOptionGroup.html';

Template.radioOptionGroup.onCreated(function radioOptionGroupOnCreated() {
    let instance = this;

    instance.currentSchema = this.data.currentSchema;

    // Here we set this Template instance's state property to equal the input state data
    // The purpose of this is to make our helpers and events more consistent across templates.
    instance.state = this.data.state;

    // Invalid keys comes from Trials schema
    instance.invalidKeys = this.data.invalidKeys;

    // Validation Context of registrationWorkflow
    instance.validationContext = this.data.validationContext;

    // isModified records whether or not the user has unsaved changes
    instance.isModified = this.data.isModified;
});

Template.radioOptionGroup.events({
    'change .js-form-update'(event, instance) {
        const value = event.currentTarget.value;
        const key = instance.data.key;
        if (event.currentTarget.checked) {
            instance.state.set(key, value);
        }
    }
});

Template.radioOptionGroup.helpers({
    value() {
        const instance = Template.instance();
        const key = instance.data.key;
        return instance.state.get(key);
    }
});