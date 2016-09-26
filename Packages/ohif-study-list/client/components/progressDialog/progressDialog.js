import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

const updateProgress = numberOfCompleted => {
    const progressDialogSettings = Session.get('progressDialogSettings');
    progressDialogSettings.numberOfCompleted = numberOfCompleted;

    Session.set('progressDialogSettings', progressDialogSettings);

    if (progressDialogSettings.numberOfCompleted === progressDialogSettings.numberOfTotal) {
        OHIF.studylist.progressDialog.close();
    }
};

const setProgressMessage = message => {
    let progressDialogSettings = Session.get('progressDialogSettings');
    progressDialogSettings.message = message;
    Session.set('progressDialogSettings', progressDialogSettings);
};

OHIF.studylist.progressDialog = {
    update: _.debounce(updateProgress, 100),
    setMessage: _.debounce(setProgressMessage, 100),
    show: function(title, numberOfTotal) {
        Session.set('progressDialogSettings', {
            title: title,
            numberOfCompleted: 0,
            numberOfTotal: numberOfTotal
        });

        $('#progressDialog').css('display', 'block');
    },
    close: function() {
        Session.set('progressDialogSettings', {
            title: '',
            numberOfCompleted: 0,
            numberOfTotal: 1
        });

        $('#progressDialog').css('display', 'none');
    }
};

Template.progressDialog.helpers({
    progressDialogTitle() {
        const settings = Session.get('progressDialogSettings');
        if (!settings) {
            return;
        }

        return settings.title;
    },

    progressStatus() {
        const settings = Session.get('progressDialogSettings');
        if (!settings) {
            return;
        }

        if (settings.numberOfCompleted === undefined ||
            settings.numberOfTotal === undefined) {
            return;
        }

        return (settings.numberOfCompleted / settings.numberOfTotal) * 100;
    },

    progressMessage() {
        const settings = Session.get('progressDialogSettings');
        if (!settings) {
            return;
        }

        return settings.message;
    }
});
