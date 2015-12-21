function closeHandler() {
    // Hide the lesion dialog
    $("#confirmDeleteDialog").css('display', 'none');

    // Remove the backdrop
    $(".removableBackdrop").remove();

    // Remove the callback from the template data
    delete Template.confirmDeleteDialog.doneCallback;
}

showConfirmDialog = function(doneCallback, options) {
    // Show the backdrop
    options = options || {};
    UI.renderWithData(Template.removableBackdrop, options, document.body);

    // Make sure the context menu is closed when the user clicks away
    $(".removableBackdrop").one('mousedown touchstart', function() {
        closeHandler();
    });

    $("#confirmDeleteDialog").css('display', 'block');

    if (doneCallback && typeof doneCallback === 'function') {
        Template.confirmDeleteDialog.doneCallback = doneCallback;
    }
};

var keys = {
    ESC: 27,
    ENTER: 13
};

Template.confirmDeleteDialog.events({
    'click #cancel, click #close': function() {
        closeHandler();
    },
    'click #confirm': function() {
        var doneCallback = Template.confirmDeleteDialog.doneCallback;
        if (doneCallback && typeof doneCallback === 'function') {
            doneCallback();
        }

        closeHandler();
    },
    'keypress #confirmDeleteDialog': function(e) {
        if (e.which === keys.ESC) {
            closeHandler();
        }

        if (this.keyPressAllowed === false) {
            return;
        }

        var doneCallback = Template.confirmDeleteDialog.doneCallback;

        // If Enter is pressed, close the dialog
        if (e.which === keys.ENTER) {
            if (doneCallback && typeof doneCallback === 'function') {
                doneCallback();
            }

            closeHandler();
        }
    }
});