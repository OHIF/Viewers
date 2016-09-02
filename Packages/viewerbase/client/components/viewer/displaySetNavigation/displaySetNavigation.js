import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

Template.displaySetNavigation.events({
    'click .js-next'(event, instance) {
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        OHIF.viewer.moveDisplaySets(true);
    },

    'click .js-prev'(event, instance) {
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        OHIF.viewer.moveDisplaySets(false);
    }
});

Template.displaySetNavigation.helpers({
    disableButton(isNext) {
        Session.get('LayoutManagerUpdated');
        return !OHIF.viewer.canMoveDisplaySets(isNext);
    }
});
