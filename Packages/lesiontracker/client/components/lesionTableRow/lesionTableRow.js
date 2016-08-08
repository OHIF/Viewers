function doneCallback(measurementData, deleteTool) {
    // If a Lesion or Non-Target is removed via a dialog
    // opened by the Lesion Table, we should clear the data for
    // the specified Timepoint Cell
    if (deleteTool === true) {
        Meteor.call('removeMeasurement', measurementData.id, function(error, response) {
            if (error) {
                log.warn(error);
            }
        });
    }
}

// Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
var keys = {
    D: 68,
    DELETE: 46
};

Template.lesionTableRow.events({
    'click .lesionRowSidebar'(event, instance) {
        const $row = instance.$('.lesionTableRow');
        $row.closest('.lesionTableView').find('.lesionTableRow').not($row).removeClass('active');
        $row.toggleClass('active');
    },

    'dblclick .location': function() {
        log.info('Double clicked on Lesion Location cell');

        var measurementData = this;

        // TODO = Fix this weird issue? Need to set toolData's ID properly..
        measurementData.id = this._id;

        changeLesionLocationCallback(measurementData, null, doneCallback);
    },

    'keydown .location': function(e) {
        var keyCode = e.which;

        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && e.ctrlKey === true)) {
            var currentMeasurement = this;
            var options = {
                keyPressAllowed: false,
                title: 'Remove measurement?',
                text: 'Are you sure you would like to remove the entire measurement?'
            };

            showConfirmDialog(() => {
                Meteor.call('removeMeasurement', currentMeasurement._id, (error, response) => {
                    if (error) {
                        log.warn(error);
                    }
                });
            }, options);
        }
    }
});
