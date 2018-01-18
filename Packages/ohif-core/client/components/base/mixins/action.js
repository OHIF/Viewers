import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
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

                // Set the focus back to the input that triggered the click with Enter key
                const $focused = $(':focus');
                const applyFocus = () => {
                    if ($focused[0] && event.currentTarget !== $focused[0]) {
                        setTimeout(() => $focused.focus());
                    }
                };

                // Stop here if the component is disabled
                if (component.$element.hasClass('disabled')) return;

                // Get the current component's API
                const api = component.getApi();

                if (typeof action === 'function') {
                    // Call the action if it's a function
                    component.actionResult = action.call(event.currentTarget, params, event);
                } else if (!api || !action || typeof api[action] !== 'function') {
                    // Stop here if no API or action was defined
                    return true;
                } else {
                    // Call the defined action function
                    component.actionResult = api[action].call(event.currentTarget, params, event);
                }

                // Prepend a spinner into the action element content if it's a promise
                if (component.actionResult instanceof Promise) {
                    const form = component.getForm();
                    form.disable(true);
                    const $spinner = $('<i class="fa fa-spin fa-circle-o-notch fa-fw m-r"></i>');
                    component.$element.prepend($spinner);
                    const finishAction = () => {
                        $spinner.remove();
                        form.disable(false);
                        applyFocus();
                    };

                    component.actionResult.then(finishAction).catch(finishAction);
                } else {
                    applyFocus();
                }
            }
        }
    }
});
