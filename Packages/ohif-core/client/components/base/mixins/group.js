import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';

/*
 * group: controls a group and its registered items
 */
OHIF.mixins.group = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the group identifier flag
            component.isGroup = true;

            // Run this computation every time the schema property is changed
            instance.autorun(() => {
                let schema = instance.data.schema;

                // Check if the schema is reactive
                if (schema instanceof ReactiveVar) {
                    // Register a dependency on schema property
                    schema = schema.get();
                }

                // Set the form's data schema
                component.schema = schema && schema.newContext();
            });

            // Get or set the child components values
            component.value = value => {
                const isGet = _.isUndefined(value);
                const isArray = instance.data.arrayValues;

                // Create the result data as array or object
                const result = isArray ? [] : {};

                // Get the group current value and return it
                if (isGet) {
                    // Iterate over each registered item and extract its value
                    component.registeredItems.forEach(child => {
                        // Check if it is an array or an object group
                        if (isArray) {
                            // Get the mixins array
                            const mixins = child.templateInstance.data.mixins.split(' ');

                            // Prevent reading action components
                            if (mixins.indexOf('action') > -1) return;

                            // Push the item value to the result array
                            result.push(child.value());
                        } else {
                            // Get the item key
                            const key = child.templateInstance.data.key;

                            //Check if a key is set for the item
                            if (key) {
                                // Add the item value to the result object
                                result[key] = child.value();
                            }
                        }
                    });

                    // Return the resulting data as array or object
                    return result;
                }

                // Get the group current value
                const groupValue = typeof value === 'object' ? value : result;

                // Stop here if there is no value defined for this group
                if (!groupValue) {
                    return;
                }

                // Iterate over each registered item and set its value
                let i = 0;
                component.registeredItems.forEach(child => {
                    const mixins = child.templateInstance.data.mixins.split(' ');

                    // Prevent reading action components
                    if (isArray && mixins.indexOf('action') > -1) return;

                    const key = isArray ? i : child.templateInstance.data.key;
                    const childValue = _.isUndefined(groupValue[key]) ? null : groupValue[key];
                    child.value(childValue);
                    i++;
                });

                // Trigger the change event after setting the new value
                component.$element.trigger('change');
            };

            // Get a registered item in form by its key
            component.item = itemKey => {
                let found;

                // Iterate over each registered form item
                component.registeredItems.forEach(child => {
                    const key = child.templateInstance.data.key;

                    // Change the found item if current key is the same as given
                    if (key === itemKey) {
                        found = child;
                    }
                });

                // Return the found item or undefined if it was not found
                return found;
            };

            // Check if the form data is valid in its schema
            const validateSelf = component.validate;
            component.validate = () => {
                // Assume validation result as true
                let result = true;

                // Return true if there's no data schema defined
                if (component.isForm && !component.schema) {
                    return result;
                }

                // Reset the validation
                const schema = component.isForm ? component.schema : component.getForm().schema;
                schema.resetValidation();

                // Validate the component itself if it has a key
                if (instance.data.pathKey && !validateSelf()) {
                    result = false;
                }

                // Iterate over each registered form item and validate it
                component.registeredItems.forEach(child => {
                    const key = child.templateInstance.data.key;

                    // Change result to false if any form item is invalid
                    if ((key || instance.data.arrayValues) && !child.validate()) {
                        result = false;
                    }
                });

                // Return the validation result
                return result;
            };

            // Disable or enable the component
            component.disable = isDisable => {
                component.registeredItems.forEach(child => child.disable(isDisable));
            };

            // Set or unset component's readonly property
            component.readonly = isReadonly => {
                component.registeredItems.forEach(child => child.readonly(isReadonly));
            };

        },

        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$('.component-group').first();
        }
    }
});
