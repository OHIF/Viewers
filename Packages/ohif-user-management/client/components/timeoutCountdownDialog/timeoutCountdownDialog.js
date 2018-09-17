import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(() => {
    const closeObserver = new Tracker.Dependency();
    $.event.add(window, 'TriggerCloseTimeoutCountdownDialog', () => closeObserver.changed());
    $.event.add(window, 'TriggerOpenTimeoutCountdownDialog', (event, timeLeft) => {
        OHIF.ui.showDialog('timeoutCountdownDialog', {
            timeLeft,
            closeObserver
        });
    });
});

Template.timeoutCountdownDialog.helpers({
    timeLeft() {
        const timeLeft = Session.get('countdownDialogTimeLeft');
        const suffix = timeLeft > 1 ? 'seconds': 'second';
        return `${timeLeft} ${suffix}`;
    }
});

Template.timeoutCountdownDialog.onCreated(() => {
    const instance = Template.instance();
    const { timeLeft, closeObserver } = instance.data;

    instance.close = callback => {
        const $modal = instance.$('.modal');
        $modal.on('hidden.bs.modal', () => callback()).modal('hide');
    };

    instance.autorun(computation => {
        closeObserver.depend();
        if (computation.firstRun) return;
        instance.close(instance.data.promiseResolve);
    });

    Session.set('countdownDialogTimeLeft', timeLeft);
});

Template.timeoutCountdownDialog.onRendered(() => {
    const instance = Template.instance();
    let timeLeft = instance.data.timeLeft;

    // Update countdownDialogTimeLeft session every second
    instance.interval = setInterval(() => {
        Session.set('countdownDialogTimeLeft', --timeLeft);
        if (!timeLeft) {
            instance.close(instance.data.promiseReject);
        }
    }, 1000);
});

Template.timeoutCountdownDialog.onDestroyed(() => {
    const instance = Template.instance();
    clearInterval(instance.interval);
    Session.delete('countdownDialogTimeLeft');
});
