import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

/*
 * input: controls a select2 component
 */
OHIF.mixins.select2 = new OHIF.Mixin({
    dependencies: 'select',
    composition: {
        onCreated() {
            const instance = Template.instance();

            // Set the custom focus flag
            instance.component.isCustomFocus = true;

            // Check if this select will include a placeholder
            const placeholder = instance.data.options && instance.data.options.placeholder;
            if (placeholder) {
                // Get the option items
                let items = instance.data.items;

                // Check if the items are reactive and get them if true
                const isReactive = items instanceof ReactiveVar;
                if (isReactive) {
                    items = items.get();
                }

                // Check if there is already an empty option on items list
                const query = {
                    value: ''
                };
                if (!_.findWhere(items, query)) {
                    // Clone the current items
                    const newItems = _.clone(items) || [];
                    newItems.unshift({
                        label: placeholder,
                        value: ''
                    });

                    // Set the new items list including the empty option
                    if (isReactive) {
                        instance.data.items.set(newItems);
                    } else {
                        instance.data.items = newItems;
                    }
                }
            }
        },

        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Apply the select2 to the component
            component.$element.select2(instance.data.options);

            // Store the select2 instance to allow its further destruction
            component.select2Instance = component.$element.data('select2');

            // Get the focusable elements
            const elements = [];
            elements.push(component.$element[0]);
            elements.push(component.$element.nextAll('.select2:first').find('.select2-selection')[0]);

            // Attach focus and blur handlers to focusable elements
            $(elements).on('focus', event => {
                if (event.target === event.currentTarget) {
                    // Show the state message on elements focus
                    component.toggleMessage(true);
                }
            }).on('blur', event => {
                if (event.target === event.currentTarget) {
                    // Hide the state message on elements blur
                    component.toggleMessage(false);
                }
            });
        },

        onDestroyed() {
            const instance = Template.instance();
            const component = instance.component;

            // Destroy the select2 instance to remove unwanted DOM elements
            component.select2Instance.destroy();
        }
    }
});
