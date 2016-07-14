import { OHIF } from 'meteor/ohif:core';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

// Helper function to get the component's current schema
const getCurrentSchema = (parentComponent, key) => {
    // Get the parent component schema
    const schema = parentComponent && parentComponent.schema;

    // Stop here if there's no key or schema defined
    if (!key || !schema) {
        return;
    }

    // Get the current schema data using component's key
    const currentSchema = schema._schema[key];

    // Return the component's schema definitions
    return currentSchema;
};

/*
 * schemaData: change the component data based on its form's schema data
 */
OHIF.mixins.schemaData = new OHIF.Mixin({
    dependencies: 'component',
    composition: {

        onData() {
            // Get the current template data
            const data = Template.currentData();

            // Get the parent component
            const parent = OHIF.blaze.getParentComponent(Blaze.currentView);

            // Get the current schema data using component's key
            const currentSchema = getCurrentSchema(parent, data.key);

            // Stop here if there's no schema data for current key
            if (!currentSchema) {
                return;
            }

            // Use schema's label if it was not defined
            if (!data.label) {
                data.label = new ReactiveVar(currentSchema.label);
            }

            // Fill the items if it's an array schema
            if (!data.items && Array.isArray(currentSchema.allowedValues)) {
                // Initialize the items array
                data.items = [];

                // Get the values and labels arrays from schema
                const values = currentSchema.allowedValues;
                const labels = currentSchema.valuesLabels || [];

                // Iterate the allowed values array
                for (let i = 0; i < values.length; i++) {
                    // Push the current item to the items array
                    data.items.push({
                        value: values[i],
                        label: labels[i] || values[i]
                    });
                }
            }
        },

        onMixins() {
            const instance = Template.instance();
            const component = instance.component;

            // Get the current schema data using component's key
            const currentSchema = getCurrentSchema(component.parent, instance.data.key);

            // Stop here if there's no schema data for current key
            if (!currentSchema) {
                return;
            }

            // Fill the component with its default value after rendering
            if (currentSchema.defaultValue) {
                component.value(currentSchema.defaultValue);
            }
        }

    }
});
