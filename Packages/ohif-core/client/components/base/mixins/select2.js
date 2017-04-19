import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

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
                instance.autorun(() => {
                    // Get the option items
                    let items = instance.data.items;

                    // Check if the items are reactive and get them if true
                    const isReactive = items instanceof ReactiveVar;
                    if (isReactive) {
                        items = items.get();
                    }

                    // Check if there is already an empty option on items list
                    if (!_.findWhere(items, { value: '' })) {
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
                });
            }
        },

        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Destroy and re-create the select2 instance
            const rebuildSelect2 = () => {
                // Destroy the select2 instance if exists and re-create it
                if (component.select2Instance) {
                    component.select2Instance.destroy();
                }

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
            };

            instance.autorun(() => {
                // Run this computation every time the reactive items suffer any changes
                const isReactive = instance.data.items instanceof ReactiveVar;
                if (isReactive) {
                    instance.data.items.dep.depend();
                }

                if (isReactive) {
                    // Keep the current value of the component
                    const currentValue = component.value();
                    Tracker.afterFlush(() => {
                        rebuildSelect2();
                        component.$element.val(currentValue);
                    });
                } else {
                    rebuildSelect2();
                }
            });
        },

        onDestroyed() {
            const instance = Template.instance();
            const component = instance.component;

            // Destroy the select2 instance to remove unwanted DOM elements
            if (component.select2Instance) {
                component.select2Instance.destroy();
            }
        }
    }
});
