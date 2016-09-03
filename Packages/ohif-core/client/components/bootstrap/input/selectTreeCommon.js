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
    // Get the common items
    items() {
        return Template.instance().data.treeInstance.getCommonItems();
    }
});
