import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

Template.selectTreeCommon.events({
    'click .select-tree-common label'(event, instance) {
        // Get the clicked label
        const $target = $(event.currentTarget);

        // Build the input selector based on the label target
        const inputSelector = '#' + $target.attr('for');

        // Get the tree instance
        const treeInstance = instance.data.treeInstance;

        // Check if the input is not rendered
        if (!$(inputSelector).length) {
            // Change the search terms with the clicked label string

            treeInstance.$('.tree-search input').val($target.text()).trigger('input');
            // Wait for options rerendering

            Tracker.afterFlush(() => {
                // Wait for components initialization
                Meteor.defer(() => $(inputSelector).click());
            });
        }
    }
});


Template.selectTreeCommon.helpers({
    // Get the common items ordered by use history
    items() {
        const instance = Template.instance();

        // Return the common items if given
        if (instance.data.commonItems) {
            return instance.data.commonItems;
        }

        // Get all the tree leaves
        const leaves = instance.data.component.getLeaves();

        // Generate an object with encoded keys from the tree leaves
        leavesObject = {};
        _.each(leaves, leaf => {
            leavesObject[OHIF.string.encodeId(leaf.value)] = leaf;
        });

        // Get the current items ranking
        const ranking = OHIF.user.getData(instance.data.storageKey);

        // Sort the items based on how many times each one was used
        const sorted = [];
        _.each(ranking, (count, key) => sorted.push([key, count]));
        sorted.sort((a, b) => b[1] - a[1]);

        // Create the result and push every item respecting the ranking order
        const result = [];
        _.each(sorted, item => {
            const current = leavesObject[item[0]];
            if (current) {
                result.push(current);
            }
        });

        // Return the resulting array
        return result;
    }
});
