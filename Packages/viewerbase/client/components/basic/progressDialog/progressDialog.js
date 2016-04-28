progressDialog = {
    /**
     * Shows progress dialog
     * @param {Object} settings - Settings used by progress dialog
     * @param {string} settings.title
     * @param {int} settings.numberOfCompleted - The value of progress dialog
     * @param {int} settings.numberOfTotal - The max value of progress dialog
     * @param {Object} [settings.messageParams] - Show a message in progress dialog by setting message and messageType
     * @param {string} [settings.messageParams.message="Progress"] - The message will be shown in the progress dialog
     * @param {string} [settings.messageParams.messageType="info"] - Sets ui, accepts bootstrap predefined classes such as success, info, warning, danger
     */
    'show': function(settings) {
        // Set dialog settings
        Session.set("progressDialogSettings", settings);
        $('#progressDialog').css('display', 'block');
    },

    /**
     * Updates the value of the progress dialog
     * @param {int} numberOfCompleted
     */
    'update': function(numberOfCompleted) {
        var progressDialogSettings = Session.get("progressDialogSettings");
        progressDialogSettings.numberOfCompleted = numberOfCompleted;

        Session.set("progressDialogSettings", progressDialogSettings);

        if (progressDialogSettings.numberOfCompleted === progressDialogSettings.numberOfTotal) {
            progressDialog.close();
        }
    },

    /**
     * Closes the progress dialog
     */
    'close': function() {
        // Reset progressDialogSettings session
        resetDialogSettingsSession();

        // Close dialog
        $('#progressDialog').css('display', 'none');
    },
    /**
     * Shows a message in the progress dialog
     * @param {Object} messageParams
     * @param {string} messageParams.message
     * @param {string} messageParams.messageType
     */
    'setMessage': function(messageParams) {
        var progressDialogSettings = Session.get("progressDialogSettings");
        if (!messageParams.messageType || messageParams.messageType == '') {
            messageParams.messageType = 'info';
        }
        progressDialogSettings.messageParams = messageParams;
        Session.set("progressDialogSettings", progressDialogSettings);
    }
};

Template.progressDialog.helpers({
    'progressDialogTitle': function () {
        if (Session.get("progressDialogSettings") && Session.get("progressDialogSettings").title) {
            return Session.get("progressDialogSettings").title;
        }

        return "Progress:";
    },
    'progressStatus': function() {
        var numberOfCompleted = 0;
        if (Session.get("progressDialogSettings") && Session.get("progressDialogSettings").numberOfCompleted) {
            numberOfCompleted = Session.get("progressDialogSettings").numberOfCompleted;
        }

        var numberofTotal = 1;
        if (Session.get("progressDialogSettings") && Session.get("progressDialogSettings").numberOfTotal) {
            numberofTotal = Session.get("progressDialogSettings").numberOfTotal;
        }

        return parseInt((numberOfCompleted / numberofTotal) * 100) + "%";
    },
    'progressMessage': function() {
        var progressDialogSettings = Session.get("progressDialogSettings");
        var messageParams = progressDialogSettings && progressDialogSettings.messageParams || false;
        if (messageParams && messageParams.message) {
            return '<span class="label label-'+messageParams.messageType+'">'+messageParams.message+'</span>';
        }
        return;
    }
});

// Resets progressDialogSettings
function resetDialogSettingsSession() {
    Session.set("progressDialogSettings",
        {
            title: 'Progress',
            numberOfCompleted: 0,
            numberOfTotal: 0,
            messageParams: {message: null, messageType: 'info'}
        }
    );
}
