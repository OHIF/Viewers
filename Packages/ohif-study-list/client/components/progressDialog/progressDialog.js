progressDialog = {
    show: function(title, numberOfTotal) {
        Session.set('progressDialogSettings', {
            title: title,
            numberOfCompleted: 0,
            numberOfTotal: numberOfTotal
        });

        $('#progressDialog').css('display', 'block');
    },
    update: function(numberOfCompleted) {
        var progressDialogSettings = Session.get('progressDialogSettings');
        progressDialogSettings.numberOfCompleted = numberOfCompleted;

        Session.set('progressDialogSettings', progressDialogSettings);

        if (progressDialogSettings.numberOfCompleted === progressDialogSettings.numberOfTotal) {
            progressDialog.close();
        }
    },
    close: function() {
        Session.set('progressDialogSettings', {
            title: '',
            numberOfCompleted: 0,
            numberOfTotal: 1
        });

        $('#progressDialog').css('display', 'none');
    },
    setMessage: function(message) {
        let progressDialogSettings = Session.get('progressDialogSettings');
        progressDialogSettings.message = message;
        Session.set('progressDialogSettings', progressDialogSettings);
    }
};

Template.progressDialog.helpers({
    progressDialogTitle() {
        var settings = Session.get('progressDialogSettings');
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

        return settings.numberOfCompleted / settings.numberOfTotal;
    },

    progressMessage() {
        var settings = Session.get('progressDialogSettings');
        if (!settings) {
            return;
        }

        return settings.message;
    }
});
