import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

/*
 * input: controls a button
 */
OHIF.mixins.button = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$('button:first');
        },

        events: {
            'click button'(event, instance) {
                const component = instance.component;

                // Extract the action and the params
                const { action, params } = instance.data;

                // Get the current component's API
                const api = component.getApi();

                // Stop here if no API or action was defined
                if (!api || !action || typeof api[action] !== 'function') {
                    return;
                }

                // Call the defined action function
                api[action].call(this, params);
            }
        }
    }
});
