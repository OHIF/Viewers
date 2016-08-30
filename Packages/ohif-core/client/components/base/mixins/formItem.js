import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Tracker } from "meteor/tracker";
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

/*
 * formItem: create a generic controller for form items
 * It may be used to manage all components that belong to forms
 */
OHIF.mixins.formItem = new OHIF.Mixin({
    dependencies: 'schemaData',
    composition: {

        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Create a observer to monitor changed values
            component.changeObserver = new Tracker.Dependency();

            // Register the component in the parent component
            component.registerSelf();

            // Declare the component elements that will be manipulated
            component.$element = $();
            component.$style = $();
            component.$wrapper = $();

            // Get or set the component's value using jQuery's val method
            component.value = value => {
                const isGet = _.isUndefined(value);
                if (isGet) {
                    return component.$element.val();
                }

                component.$element.val(value).trigger('change');
            };

            // Disable or enable the component
            component.disable = isDisable => {
                component.$element.prop('disabled', !!isDisable);
            };

            // Set or unset component's readonly property
            component.readonly = isReadonly => {
                component.$element.prop('readonly', !!isReadonly);
            };

            // Show or hide the component
            component.show = isShow => {
                const method = isShow ? 'show' : 'hide';
                component.$wrapper[method]();
            };

            // Add or remove a state from the component
            component.state = (state, flag) => {
                component.$wrapper.toggleClass(`state-${state}`, !!flag);
            };

            // Set the component in error state and display the error message
            component.error = errorMessage => {
                // Set the component error state
                component.state('error', errorMessage);

                // Set or remove the error message
                if (errorMessage) {
                    component.$element.trigger('errorin');
                    component.$wrapper.attr('data-error', errorMessage);
                } else {
                    component.$element.trigger('errorout');
                    component.$wrapper.removeAttr('data-error', errorMessage);
                }
            };

            // Search for the parent form component
            component.getForm = () => {
                let currentComponent = component;
                while (currentComponent) {
                    currentComponent = currentComponent.parent;
                    if (currentComponent && currentComponent.isForm) {
                        return currentComponent;
                    }
                }
            };

            // Check if the component value is valid in its form's schema
            component.validate = () => {
                // Get the component's form
                const form = component.getForm();

                // Get the form's data schema
                const schema = form && form.schema;

                // Get the current component's key
                const key = instance.data.pathKey;

                // Return true if validation is not needed
                if (!key || !schema || !component.$wrapper.is(':visible')) {
                    return true;
                }

                // Create the data document for validation
                const document = {
                    [key]: component.value()
                };

                // Check if the document validation failed
                if (!schema.validateOne(document, key)) {
                    // Set the component in error state and display the message
                    component.error(schema.keyErrorMessage(key));

                    // Return false for validation
                    return false;
                }

                // Remove the component error state and message
                component.error(false);

                // Return true for validation
                return true;
            };

            component.depend = () => {
                return component.changeObserver.depend();
            };

        },

        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$(':input').first();

            // Set the most outer wrapper element
            component.$wrapper = instance.wrapper.$('*').first();
        },

        onDestroyed() {
            const instance = Template.instance();

            // Register the component in the parent component
            instance.component.unregisterSelf();
        },

        onMixins() {
            const instance = Template.instance();
            const component = instance.component;

            // If no style element was defined, set it as the element itself
            if (!component.$style.length) {
                component.$style = component.$element;
            }

            // Set the component in jQuery data after all mixins are rendered
            component.$element.data('component', component);
        },

        events: {

            // Enable reactivity by changing a Tracker.Dependency observer
            change(event, instance) {
                instance.component.changeObserver.changed();
            },

            // TODO: [design] remove log, show error box/hint over the wrapper
            errorin(event, instance) {
                event.stopPropagation();
                console.log('ERROR when validating component', instance.component);
            },

            // TODO: [design] hide error box/hint
            errorout(event, instance) {
                event.stopPropagation();
            }

        }

    }
});
