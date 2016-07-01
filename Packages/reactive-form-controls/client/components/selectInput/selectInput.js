import { Template } from 'meteor/templating';

import './selectInput.html';

Template.selectInput.onCreated(function selectInputOnCreated() {
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

Template.selectInput.helpers({
    selectedOptionValue() {
        const instance = Template.instance();
        var key = instance.data.key;
        return instance.state.get(key);
    }
});

Template.selectInput.events({
    'change .js-form-update'(event, instance) {
        const value = $(event.currentTarget).val();
        const key = instance.data.key;
        instance.state.set(key, value);
    }
});