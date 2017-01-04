import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.toolbarSectionTools.events({
    'click .expandable'(event, instance) {
        const $target = $(event.currentTarget);
        const isExpanded = $target.hasClass('expanded');
        $target.toggleClass('expanded', !isExpanded);
    },

    'focusout .expandable'(event, instance) {
        const target = event.target;
        const currentTarget = event.currentTarget;

        // Postpone the execution to be able to get the focused element
        Meteor.defer(() => {
            const $focused = $(':focus');
            const $expandable = $(currentTarget).closest('.expandable');
            const focusInside = $expandable.find(':focus').length;

            // Check if the expandable lost the focus
            if (!$focused.length || !focusInside) {
                // Stop here if focus is going from subtool to expandable tool
                if (currentTarget !== target && $focused[0] === currentTarget) {
                    return;
                }

                $expandable.removeClass('expanded');
            }
        });
    }
});
