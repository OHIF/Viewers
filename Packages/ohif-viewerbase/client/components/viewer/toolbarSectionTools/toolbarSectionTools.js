import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.toolbarSectionTools.events({
    'click .expandable'(event, instance) {
        const $target = $(event.currentTarget);
        const isExpanded = $target.hasClass('expanded');
        $target.toggleClass('expanded', !isExpanded);

        // Remove the previously set repositioning css attribute
        const $box = $target.find('.toolbarSectionDrawerContainer:first');
        $box.css('left', '');

        // Stop here if the tool group is not expanded
        if (isExpanded) {
            return;
        }

        // Move the box left or right if it is overflowing the window
        const transitionendHandler = event => {
            const originalEvent = event.originalEvent;
            const propertyName = originalEvent && originalEvent.propertyName;
            if (propertyName && propertyName === 'transform') {
                $target.off('transitionend', transitionendHandler);
            } else {
                return;
            }

            const boxWidth = $box.outerWidth();
            const start = $box.offset().left;
            const bodyWidth = $(document.body).outerWidth();
            const end = start + boxWidth;

            if (start < 0) {
                $box.css('left', `calc(50% - ${start}px)`);
            } else if (end > bodyWidth) {
                const diff = end - bodyWidth;
                $box.css('left', `calc(50% - ${diff}px)`);
            }
        };

        // Attach the handler to deal with position fixing
        $target.on('transitionend', transitionendHandler);
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
