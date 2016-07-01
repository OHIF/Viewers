import { Template } from 'meteor/templating';

import './select2Input.html';

Template.select2Input.onCreated(function selectInputOnCreated() {
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

Template.select2Input.onRendered(function select2InputOnRendered() {
    const instance = this;

    Meteor.defer(function() {
        // Initialize select2 box
        const selectBox = instance.$('select');
        selectBox.select2(instance.data.select2Options);

        // Set selected value(s) from current state;
        const key = instance.data.key;
        const value = instance.state.get(key);
        if (value) {
            selectBox.val(value).trigger('change');
        }
    });
});

Template.select2Input.helpers({
    options() {
        const instance = Template.instance();
        if (instance.data.options) {
            return instance.data.options;
        }

        const key = instance.data.key;
        const schema = instance.currentSchema.schema(key);
        const allowedValues = schema.allowedSelect2Values;
        return allowedValues.map((value) => {
            return {
                id: value,
                text: value
            };
        });
    }
});

Template.select2Input.events({
    'focus .select2'(event, instance) {
        var control = event.currentTarget;

        // Find select element that is assigned to select2
        var hiddenSelect2Box = $(control).prev('select');

        // Prevent auto open for select2 boxes that has multiple attribute
        if (!hiddenSelect2Box || $(hiddenSelect2Box).prop('multiple')) {
            return;
        }

        $(hiddenSelect2Box).select2('open');
    },

    'change .js-form-update'(event, instance) {
        const value = $(event.currentTarget).val();
        const key = instance.data.key;
        instance.state.set(key, value);
    }
});
