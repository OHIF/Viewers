function closeHandler(dialog) {
    // Hide the lesion dialog
    $(dialog).css('display', 'none');

    // Remove the backdrop
    $('.removableBackdrop').remove();

    // Restore the focus to the active viewport
    setFocusToActiveViewport();
}

changeNonTargetResponse = function(measurementData, eventData, doneCallback) {
    Template.nonTargetResponseDialog.measurementData = measurementData;
    Template.nonTargetResponseDialog.doneCallback = doneCallback;

    // Get the non-target lesion location dialog
    var dialog = $('#nonTargetResponseDialog');
    Template.nonTargetResponseDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);

        if (doneCallback && typeof doneCallback === 'function') {
            var deleteTool = true;
            doneCallback(measurementData, deleteTool);
        }
    });

    // Show the nonTargetLesion dialog above
    var dialogProperty = {
        display: 'block'
    };

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (!eventData || isTouchDevice()) {
        // add dialogMobile class to provide a black,transparent background
        dialog.addClass('dialogMobile');
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
    } else {
        dialogProperty.top = eventData.currentPoints.page.y - dialog.outerHeight() - 40;
        dialogProperty.left = eventData.currentPoints.page.x - dialog.outerWidth() / 2;

        var pageHeight = $(window).height();
        dialogProperty.top = Math.max(dialogProperty.top, 0);
        dialogProperty.top = Math.min(dialogProperty.top, pageHeight - dialog.outerHeight());

        var pageWidth = $(window).width();
        dialogProperty.left = Math.max(dialogProperty.left, 0);
        dialogProperty.left = Math.min(dialogProperty.left, pageWidth - dialog.outerWidth());
    }

    dialog.css(dialogProperty);
    dialog.focus();

    var measurement = Measurements.findOne(measurementData.id);
    if (!measurement) {
        return;
    }

    var response = measurement.timepoints[measurementData.timepointId].response;

    // TODO = Standardize this. Searching by code probably isn't the best, we should use
    // some sort of UID
    var currentResponse = LocationResponses.findOne({
        code: response
    });

    if (!currentResponse) {
        return;
    }

    LocationResponses.update(currentResponse._id, {
        $set: {
            selected: true
        }
    });
};

Template.nonTargetResponseDialog.events({
    'click #nonTargetLesionOK': function() {
        var dialog = Template.nonTargetResponseDialog.dialog;
        var measurementData = Template.nonTargetResponseDialog.measurementData;

        // Find the select option box
        var selectorResponse = dialog.find('select#selectNonTargetLesionLocationResponse');

        // Get the current value of the selector
        var responseOptionId = selectorResponse.find('option:selected').val();

        // If the selected response option is still the default (-1)
        // then stop here
        if (responseOptionId < 0) {
            return;
        }

        if (!measurementData.id) {
            // Add an ID value to the tool data to link it to the Measurements collection
            measurementData.id = 'notready';
        }

        /// Set the isTarget value to true, since this is the target-lesion dialog callback
        measurementData.isTarget = false;

        // Response is set from location response list
        measurementData.response = responseOptionId;

        // Adds lesion data to timepoints array
        LesionManager.updateLesionData(measurementData);

        // Close the dialog
        closeHandler(dialog);
    },
    'click #removeLesion': function() {
        var measurementData = Template.nonTargetResponseDialog.measurementData;
        var doneCallback = Template.nonTargetResponseDialog.doneCallback;
        var dialog = Template.nonTargetResponseDialog.dialog;

        showConfirmDialog(function() {
            if (doneCallback && typeof doneCallback === 'function') {
                var deleteTool = true;
                doneCallback(measurementData, deleteTool);
            }
        });

        closeHandler(dialog);
    },
    'click #btnCloseLesionPopup': function() {
        var dialog = Template.nonTargetResponseDialog.dialog;
        closeHandler(dialog);
    },
    'keydown #nonTargetResponseDialog': function(e) {
        var dialog = Template.nonTargetResponseDialog.dialog;

        // If Esc or Enter are pressed, close the dialog
        if (e.which === keys.ESC || e.which === keys.ENTER) {
            closeHandler(dialog);
            return false;
        }
    }
});

Template.nonTargetResponseDialog.helpers({
    locationResponses: function() {
        return LocationResponses.find();
    }
});
