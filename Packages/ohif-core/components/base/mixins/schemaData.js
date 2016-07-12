import { OHIF } from 'meteor/ohif:core';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

/*
 * schemaData: change the component data based on its form's schema data
 */
OHIF.mixins.schemaData = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {

        onData() {
            const data = Template.currentData();

            const parent = OHIF.blaze.getParentComponent(Blaze.currentView);

            // Get the parent component schema
            const schema = parent && parent.schema;

            // Get the current component's key
            const key = data.key;

            // Stop here if there's no key or schema defined
            if (!key || !schema) {
                return;
            }

            // Get the current schema data using component's key
            const currentSchema = schema._schema[key];

            // Stop here if there's no schema data for current key
            if (!currentSchema) {
                return;
            }

            // Use schema's label if it was not defined
            if (!data.label) {
                data.label = new ReactiveVar(currentSchema.label);
            }

            // TODO: [design] convert allowedValues to items and find a way to get key/value pairs
        }

    }
});
