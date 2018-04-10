import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.dialogSimple.onCreated(() => {
    const instance = Template.instance();

    instance.close = () => {
        instance.$('.modal').modal('hide');
    };

    // Automatically close the modal if a timeout value was given
    if (instance.data.timeout) {
        Meteor.setTimeout(instance.close, instance.data.timeout);
    }
});

Template.dialogSimple.onRendered(() => {
    const instance = Template.instance();

    // Allow options ovewrite
    const modalOptions = _.extend({
        backdrop: 'static',
        keyboard: false
    }, instance.data.modalOptions);

    const $modal = instance.$('.modal');

    // Create the bootstrap modal
    $modal.modal(modalOptions);

    // Resolve the promise as soon as the modal is closed
    $modal.one('hidden.bs.modal', () => instance.data.promiseResolve());

    let position = instance.data.position;

    const { event } = instance.data;
    if (!position && event && !_.isUndefined(event.clientX)) {
        position = {
            x: event.clientX,
            y: event.clientY
        };
    }

    if (position) {
        OHIF.ui.repositionDialog($modal, position.x, position.y);
    }
});

Template.dialogSimple.events({
    keydown(event) {
        const instance = Template.instance();
        const keyCode = event.keyCode || event.which;

        if (keyCode === 27) {
            instance.close();
            event.stopPropagation();
        }
    }
});
