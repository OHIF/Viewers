import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';

/*
 * input: controls a tree selection component
 */
OHIF.mixins.selectTree = new OHIF.Mixin({
    dependencies: 'group',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;
            const rootComponent = instance.data.root || component;
            const rootInstance = rootComponent.templateInstance;

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

            // Return plain data for all the leaves inside current node
            component.getLeaves = () => {
                const recursiveSeek = (items, result=[]) => {
                    _.each(items, item => {
                        if (item.items) {
                            recursiveSeek(item.items, result);
                        } else {
                            result.push(item);
                        }
                    });
                    return result;
                };

                return recursiveSeek(instance.data.items);
            };

        }
    }
});
