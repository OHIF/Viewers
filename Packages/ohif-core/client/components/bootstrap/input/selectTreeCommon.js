import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

Template.selectTreeCommon.helpers({
    // Get the common items ordered by use history
    items() {
        const instance = Template.instance();

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
