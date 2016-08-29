import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

/*
 * input: controls a basic select
 */
OHIF.mixins.select = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {

        onCreated() {
            const instance = Template.instance();

            // Check if this select will include an empty option
            if (instance.data.emptyOption) {
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
                    const newItems = _.clone(items);
                    newItems.unshift({
                        label: 'Select',
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

            // Set the element to be controlled
            component.$element = instance.$('select:first');
        }

    }
});
