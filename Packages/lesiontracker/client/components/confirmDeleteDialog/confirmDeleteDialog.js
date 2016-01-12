function closeHandler() {
    // Hide the lesion dialog
    $('#confirmDeleteDialog').css('display', 'none');

    // Remove the backdrop
    $('.removableBackdrop').remove();

    // Remove the callback from the template data
    delete Template.confirmDeleteDialog.doneCallback;

    // Restore the focus to the active viewport
    setFocusToActiveViewport();
}

/**
 * Displays the confirmation dialog template and the removable backdrop element
 *
 * @param doneCallback A callback
 * @param options
 */
showConfirmDialog = function(doneCallback, options) {
    // Show the backdrop
    options = options || {};
    UI.renderWithData(Template.removableBackdrop, options, document.body);

    var confirmDeleteDialog = $('#confirmDeleteDialog');
    confirmDeleteDialog.remove();

    var viewer = document.getElementById('viewer');
    UI.renderWithData(Template.confirmDeleteDialog, options, viewer);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler();
    });

    confirmDeleteDialog = $('#confirmDeleteDialog');
    confirmDeleteDialog.css('display', 'block');
    confirmDeleteDialog.focus();

    if (doneCallback && typeof doneCallback === 'function') {
        Template.confirmDeleteDialog.doneCallback = doneCallback;
    }
};

// Global object of key names (TODO: put this somewhere else)
keys = {
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
    'keydown #confirmDeleteDialog': function(e) {
        if (e.which === keys.ESC) {
            closeHandler();
            return false;
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
