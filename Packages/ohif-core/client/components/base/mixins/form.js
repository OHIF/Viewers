import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Spacebars } from 'meteor/spacebars';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

/*
 * form: controls a form and its registered inputs
 */
OHIF.mixins.form = new OHIF.Mixin({
    dependencies: 'group',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the form identifier flag
            component.isForm = true;

            // Set the form validated flag
            component.isValidatedAlready = false;

            component.validationObserver = new Tracker.Dependency();

            // Reset the pathKey
            instance.data.pathKey = '';

            // Debound the observer call to prevent tons of re-rendering
            component.validationRan = _.throttle(() => {
                // Enable reactivity by changing a Tracker.Dependency observer
                component.validationObserver.changed();
            }, 200);

            // Change the validation function to focus the fields with error
            const validateSelf = component.validate;
            component.validate = () => {
                // Call the original validation function
                const validationResult = validateSelf();

                // Change the form validated flag to true
                component.isValidatedAlready = true;

                // Focus the first error field if some validation failed
                if (component.schema && component.schema._invalidKeys.length) {
                    Tracker.afterFlush(() => instance.$('.state-error :input:first').focus());
                }

                return validationResult;
            };
        },

        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the component main and style elements
            component.$style = component.$element = instance.$('form').first();

            // Block page redirecting on submit
            component.$element[0].onsubmit = () => false;
        },

        events: {
            'click .validation-error-container a'(event, instance) {
                // Get the target key
                const targetKey = $(event.currentTarget).attr('data-target');

                // Focus the first input inside the element with error state
                instance.$(`.state-error[data-key="${targetKey}"]`).find(':input:first').focus();
            }
        },

        helpers: {
            validationErrors() {
                const instance = Template.instance();
                const component = instance.component;

                // Create a dependency on child components validation
                component.validationObserver.depend();

                // Stop here if no schema was defined for the form
                if (!component.schema) {
                    return;
                }

                // Check if there were some validation errors
                if (component.schema._invalidKeys.length) {
                    const result = [];

                    // Iterate over each validation error and add to result
                    component.schema._invalidKeys.forEach(item => {
                        const label = component.schema._schema[item.name].label;
                        let message = component.schema.keyErrorMessage(item.name);
                        message = message.replace(label, `<strong>${label}</strong>`);
                        result.push({
                            key: item.name,
                            message: Spacebars.SafeString(message)
                        });
                    });

                    // Return the resulting validation errors
                    return result;
                }
            }
        }
    }
});
