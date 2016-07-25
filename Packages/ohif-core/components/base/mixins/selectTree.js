import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

/*
 * input: controls a tree selection component
 */
OHIF.mixins.selectTree = new OHIF.Mixin({
    dependencies: 'group',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Create the component's value storage property
            instance.data.currentNode = new ReactiveVar(null);

            // Share the component in data property
            instance.data.component = component;

            // Override the default value method
            component.value = value => {
                const isGet = _.isUndefined(value);

                // Return the current node value
                if (isGet) {
                    const currentNode = instance.data.currentNode.get();
                    return currentNode ? currentNode.value : null;
                }

                // get the items array
                const items = component.templateInstance.data.items;

                // Get the node for the selected value
                const node = _.findWhere(items, {
                    value: value
                });

                // Change the current node
                instance.data.currentNode.set(node);
            };
        },

        events: {
            'change .select-tree:first>.tree-options>label>input'(event, instance) {
                const component = instance.component;
                const $target = $(event.target);
                const eventComponent = $target.data('component');

                // Change the active item
                const rootComponent = instance.data.root || component;
                rootComponent.templateInstance.$('label').removeClass('active');
                $target.closest('label.tree-leaf').addClass('active');

                // Change the component's value
                component.value(eventComponent.value());
            },

            'click .select-tree:first>.tree-options>.tree-breadcrumb>.tree-back'(event, instance) {
                // Prevent the default element action
                event.preventDefault();

                // Reset the checked inputs to unchecked state
                const rootComponent = instance.data.root || instance.component;
                rootComponent.templateInstance.$('input').removeAttr('checked');

                // Get the index of the breadcrumb's clicked option
                const index = $(event.currentTarget).attr('data-index') | 0;

                // Set the current instance
                let currentInstance = instance.component.parent.templateInstance;

                // Iterate over all parents until gets into the clicked node
                for (let i = 1; i <= index; i++) {
                    // Unset the selected node
                    currentInstance.data.currentNode.set(null);

                    // Check if it's not the root node
                    if (i < index) {
                        // Change the current instance
                        currentInstance = currentInstance.component.parent.templateInstance;
                    }
                }
            }
        }
    }
});
