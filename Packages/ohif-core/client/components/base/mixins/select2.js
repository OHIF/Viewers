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
        },

        onDestroyed() {
            const instance = Template.instance();
            const component = instance.component;

            // Destroy the select2 instance to remove unwanted DOM elements
            component.select2Instance.destroy();
        },

        events: {
            'focus .select2-hidden-accessible'(event, instance) {
                // Redirect the focus to select2 focus control in case of hidden
                // accessible being focused (e.g. clicking on outer label)
                $(event.currentTarget).nextAll('.select2:first').find('.select2-selection').focus();
            }
        }
    }
});
