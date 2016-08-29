import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

/*
 * form: controls a form and its registered inputs
 */
OHIF.mixins.form = new OHIF.Mixin({
    dependencies: 'group',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Run this computation every time the schema property is changed
            instance.autorun(() => {
                let schema;

                // Check if the schema is reactive
                if (instance.data.schema instanceof ReactiveVar) {
                    // Register a dependency on schema property
                    schema = instance.data.schema.get();
                }

                // Set the form's data schema
                component.schema = schema && schema.newContext();
            });

            // Check if the form data is valid in its schema
            component.validate = () => {
                // Assume validation result as true
                let result = true;

                // Return true if there's no data schema defined
                if (!component.schema) {
                    return result;
                }

                // Iterate over each registered form item and validate it
                component.registeredItems.forEach(child => {
                    const key = child.templateInstance.data.key;

                    // Change result to false if any form item is invalid
                    if (key && !child.validate()) {
                        result = false;
                    }
                });

                // Return the validation result
                return result;
            };
        },
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the component main and style elements
            component.$style = component.$element = instance.$('form:first');
        }
    }
});
