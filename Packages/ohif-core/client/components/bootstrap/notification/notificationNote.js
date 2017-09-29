import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.notificationNote.onRendered(() => {
    const instance = Template.instance();
    Meteor.setTimeout(() => {
        const $note = instance.$('.notification-note');
        $note.css('max-height', $note.outerHeight()).addClass('in');
    }, 100);
});

Template.notificationNote.events({
    'click .note-dismiss'(event, instance) {
        if (instance.data.promiseResolve) {
            instance.data.promiseResolve();
        } else {
            OHIF.ui.notifications.dismiss(instance.data.id);
        }
    }
});
