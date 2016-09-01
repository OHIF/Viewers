import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

Template.displaySetNavigation.events({
    'click .js-next'(event, instance) {
        OHIF.viewer.moveDisplaySets(true);
    },

    'click .js-prev'(event, instance) {
        OHIF.viewer.moveDisplaySets(false);
    }
});

Template.displaySetNavigation.helpers({
    disableButton(isPrevious) {

    }
});
