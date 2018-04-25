import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

OHIF.ui.handleError = error => {
    let { title, message } = error;

    if (!title) {
        if (error instanceof Meteor.Error) {
            title = error.error;
        } else if (error instanceof Error) {
            title = error.name;
        }
    }

    if (!message) {
        if (error instanceof Meteor.Error) {
            message = error.reason;
        } else if (error instanceof Error) {
            message = error.message;
        }
    }

    const data = Object.assign({
        title,
        message,
        class: 'themed',
        hideConfirm: true,
        cancelLabel: 'Dismiss',
        cancelClass: 'btn-secondary'
    }, error || {});

    OHIF.log.error(error);
    // TODO: Find a better way to handle errors instead of displaying a dialog for all of them.
    // OHIF.ui.showDialog('dialogForm', data);
};
