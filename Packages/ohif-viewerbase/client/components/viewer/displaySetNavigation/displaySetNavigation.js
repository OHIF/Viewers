import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

Template.displaySetNavigation.events({
    'click .js-next'(event, instance) {
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        OHIF.viewerbase.layoutManager.moveDisplaySets(true);
    },

    'click .js-prev'(event, instance) {
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        OHIF.viewerbase.layoutManager.moveDisplaySets(false);
    }
});

Template.displaySetNavigation.helpers({
    disableButton(isNext) {
        Session.get('LayoutManagerUpdated');

        if (!OHIF.viewerbase.layoutManager) {
            return;
        }

        return !OHIF.viewerbase.layoutManager.canMoveDisplaySets(isNext);
    }
});
