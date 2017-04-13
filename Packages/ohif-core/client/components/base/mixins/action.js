import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

/*
 * action: controls an element that will trigger some form API's method
 */
OHIF.mixins.action = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Add the form-action identification class
            component.$element.addClass('form-action');
        },

        events: {
            'click .form-action'(event, instance) {
                event.preventDefault();
                const component = instance.component;

                // Extract action, disabled state and params
                const { action } = instance.data;
                const params = instance.data.params ? instance.data.params : event;

                // Stop here if the component is disabled
                if (component.$element.hasClass('disabled')) return;

                // Get the current component's API
                const api = component.getApi();

                // Stop here calling the action if it's a function
                if (typeof action === 'function') {
                    component.actionResult = action.call(event.currentTarget, params);
                    return component.actionResult;
                }

                // Stop here if no API or action was defined
                if (!api || !action || typeof api[action] !== 'function') return;

                // Call the defined action function
                component.actionResult = api[action].call(event.currentTarget, params);

                // Prepend a spinner into the action element content if it's a promise
                if (component.actionResult instanceof Promise) {
                    const form = component.getForm();
                    form.disable(true);
                    const $spinner = $('<i class="fa fa-spin fa-circle-o-notch fa-fw m-r"></i>');
                    component.$element.prepend($spinner);
                    const dismissSpinner = () => {
                        $spinner.remove();
                        form.disable(false);
                    };

                    component.actionResult.then(dismissSpinner).catch(dismissSpinner);
                }

                return component.actionResult;
            }
        }
    }
});
