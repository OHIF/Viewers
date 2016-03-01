progressDialog = {
    'show': function(title, numberOfTotal) {
        Session.set("progressDialogSettings", { title: title, numberOfCompleted: 0, numberOfTotal: numberOfTotal });

        $('#progressDialog').css('display', 'block');
    },
    'update': function(numberOfCompleted) {
        var progressDialogSettings = Session.get("progressDialogSettings");
        progressDialogSettings.numberOfCompleted = numberOfCompleted;

        Session.set("progressDialogSettings", progressDialogSettings);

        if (progressDialogSettings.numberOfCompleted === progressDialogSettings.numberOfTotal) {
            progressDialog.close();
        }
    },
    'close': function() {
        Session.set("progressDialogSettings", { title: "", numberOfCompleted: 0, numberOfTotal: 1 });
        $('#progressDialog').css('display', 'none');
    },
};

Template.progressDialog.helpers({
    'progressDialogTitle': function () {
        if (Session.get("progressDialogSettings") && Session.get("progressDialogSettings").title) {
            return Session.get("progressDialogSettings").title;
        }

        return "";
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
    }
});
