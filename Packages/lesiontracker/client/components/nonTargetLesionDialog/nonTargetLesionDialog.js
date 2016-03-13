function closeHandler(dialog) {
    // Hide the lesion dialog
    $(dialog).css('display', 'none');

    // Remove the backdrop
    $('.removableBackdrop').remove();

    // Restore the focus to the active viewport
    setFocusToActiveViewport();
}

// This event sets lesion number for new lesion
function setLesionNumberCallback(measurementData, eventData, doneCallback) {
    // Get the current element's timepointId from the study date metadata
    var element = eventData.element;
    var enabledElement = cornerstone.getEnabledElement(element);
    var imageId = enabledElement.image.imageId;

    var study = cornerstoneTools.metaData.get('study', imageId);

    // Find the relevant timepoint given the current study
    var timepoint = Timepoints.findOne({
        studyInstanceUids: {
            $in: [study.studyInstanceUid]
        }
    });

    if (!timepoint) {
        return;
    }

    measurementData.timepointId = timepoint.timepointId;

    // Get a lesion number for this lesion, depending on whether or not the same lesion previously
    // exists at a different timepoint
    var lesionNumber = LesionManager.getNewLesionNumber(measurementData.timepointId, isTarget = false);
    measurementData.lesionNumber = lesionNumber;

    // Set lesion number
    doneCallback(lesionNumber);
}

function selectNonTargetResponse(responseCode) {
    // First, disable all other responses
    LocationResponses.update({}, {
        $set: {
            selected: false
        }
    }, {
        multi: true
    });

    // If no response code is specified, leave them all disabled
    if (!responseCode) {
        return;
    }

    // Find the specified response by code and set it as selected
    LocationResponses.update({
        code: responseCode
    }, {
        $set: {
            selected: true
        }
    });
}

// This event determines whether or not to show the Non-Target lesion dialog
// If there already exists a lesion with this specific lesion number,
// related to the chosen location.
function getLesionLocationCallback(measurementData, eventData) {
    Template.nonTargetLesionDialog.measurementData = measurementData;

    // Get the non-target lesion location dialog
    var dialog = $('#nonTargetLesionLocationDialog');
    Template.nonTargetLesionDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Find the select option box
    var selectorLocation = dialog.find('select#selectNonTargetLesionLocation');

    selectorLocation.find('option:first').prop('selected', 'selected');

    // LT-112 "Non-target response shall default to non-measurable on baseline, present on follow-up"
    var timepoint = Timepoints.findOne({
        timepointId: measurementData.timepointId
    });

    if (timepoint && timepoint.timepointType === 'baseline') {
        selectNonTargetResponse('Present');
    } else {
        selectNonTargetResponse();
    }

    // Allow location selection
    selectorLocation.removeAttr('disabled');

    // Find out if this lesion number is already added in the lesion manager for another timepoint
    // If it is, disable selector location
    var locationId = LesionManager.lesionNumberExists(measurementData);
    if (locationId) {
        // Add an ID value to the tool data to link it to the Measurements collection
        measurementData.id = 'notready';

        measurementData.locationId = locationId;

        // Disable the selection of a new location
        disableLocationSelection(measurementData.locationId);
    }

    // Disable selector location to prevent selecting a new location
    function disableLocationSelection(locationId) {
        var locationObject = LesionLocations.findOne({
                id: locationId
            });
        
        if (!locationObject) {
            return;
        }
        
        selectorLocation.find('option[value="' + locationObject._id + '"]').prop('selected', true);
        selectorLocation.prop('disabled', true);
    }

    // Show the nonTargetLesion dialog above
    var dialogProperty = {
        top: eventData.currentPoints.page.y - dialog.outerHeight() - 40,
        left: eventData.currentPoints.page.x - dialog.outerWidth() / 2,
        display: 'block'
    };

    var pageHeight = $(window).height();
    dialogProperty.top = Math.max(dialogProperty.top, 0);
    dialogProperty.top = Math.min(dialogProperty.top, pageHeight - dialog.outerHeight());

    var pageWidth = $(window).width();
    dialogProperty.left = Math.max(dialogProperty.left, 0);
    dialogProperty.left = Math.min(dialogProperty.left, pageWidth - dialog.outerWidth());

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (isTouchDevice()) {
        // add dialogMobile class to provide a black,transparent background
        dialog.addClass('dialogMobile');
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
        dialogProperty.margin = 'auto';
    }

    dialog.css(dialogProperty);
}

changeNonTargetLocationCallback = function(measurementData, eventData, doneCallback) {
    Template.nonTargetLesionDialog.measurementData = measurementData;
    Template.nonTargetLesionDialog.doneCallback = doneCallback;

    // Get the non-target lesion location dialog
    var dialog = $('#nonTargetLesionRelabelDialog');
    Template.nonTargetLesionDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Find the select option box
    var selectorLocation = dialog.find('select#selectNonTargetLesionLocation');
    var selectorResponse = dialog.find('select#selectNonTargetLesionLocationResponse');

    selectorLocation.find('option:first').prop('selected', 'selected');
    selectorResponse.find('option:first').prop('selected', 'selected');

    // Allow location selection
    selectorLocation.removeAttr('disabled');

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
    }

    dialog.css(dialogProperty);
    dialog.focus();

    var measurement = Measurements.findOne(measurementData.id);
    if (!measurement) {
        return;
    }

    LesionLocations.update({}, {
        $set: {
            selected: false
        }
    }, {
        multi: true
    });

    var currentLocation = LesionLocations.findOne({
        id: measurement.locationId
    });

    if (!currentLocation) {
        return;
    }

    LesionLocations.update(currentLocation._id, {
        $set: {
            selected: true
        }
    });

    var response = measurement.timepoints[measurementData.timepointId].response;
    selectNonTargetResponse(response);
};

var config = {
    setLesionNumberCallback: setLesionNumberCallback,
    getLesionLocationCallback: getLesionLocationCallback,
    changeLesionLocationCallback: changeNonTargetLocationCallback
};

cornerstoneTools.nonTarget.setConfiguration(config);

Template.nonTargetLesionDialog.events({
    'change #selectNonTargetLesionLocationResponse': function(e) {
        var responseCode = $(e.currentTarget).val();
        selectNonTargetResponse(responseCode);
    },
    'click #nonTargetLesionOK': function() {
        var dialog = Template.nonTargetLesionDialog.dialog;
        var measurementData = Template.nonTargetLesionDialog.measurementData;

        // Find the select option box
        var selectorLocation = dialog.find('select#selectNonTargetLesionLocation');

        // Get the current value of the selector
        var selectedOptionId = selectorLocation.find('option:selected').val();

        // If the selected option is still the default (-1)
        // then stop here
        if (selectedOptionId < 0) {
            return;
        }

        // Get selected location data
        var locationObj = LesionLocations.findOne({
            _id: selectedOptionId
        });

        if (measurementData.id) {
            // Update the location data
            Measurements.update(measurementData.id, {
                $set: {
                    location: locationObj.location,
                    locationId: locationObj.id
                }
            });
        } else {
            // Add an ID value to the tool data to link it to the Measurements collection
            measurementData.id = 'notready';
        }

        /// Set the isTarget value to true, since this is the target-lesion dialog callback
        measurementData.isTarget = false;

        // Response is set from location response list
        measurementData.response = LocationResponses.findOne({selected: true}).code;

        // Adds lesion data to timepoints array
        LesionManager.updateLesionData(measurementData);

        // Close the dialog
        closeHandler(dialog);
    },
    'click #removeLesion': function() {
        var measurementData = Template.nonTargetLesionDialog.measurementData;
        var doneCallback = Template.nonTargetLesionDialog.doneCallback;
        var dialog = Template.nonTargetLesionDialog.dialog;

        showConfirmDialog(function() {
            if (doneCallback && typeof doneCallback === 'function') {
                var deleteTool = true;
                doneCallback(measurementData, deleteTool);
            }
        });

        closeHandler(dialog);
    },
    'click #btnCloseLesionPopup': function() {
        var dialog = Template.nonTargetLesionDialog.dialog;
        closeHandler(dialog);
    },
    'click a.convertNonTarget': function(evt) {
        var measurementData = Template.nonTargetLesionDialog.measurementData;
        var dialog = Template.nonTargetLesionDialog.dialog;

        var button = $(evt.currentTarget);
        var toolType = button.data('type');

        convertNonTarget(measurementData, toolType);

        closeHandler(dialog);
    },
    'keydown #lesionLocationDialog, keydown #lesionLocationRelabelDialog': function(e) {
        var dialog = Template.nonTargetLesionDialog.dialog;

        // If Esc or Enter are pressed, close the dialog
        if (e.which === keys.ESC || e.which === keys.ENTER) {
            closeHandler(dialog);
            return false;
        }
    }
});

var conversionOptions = [{
    id: 'bidirectional',
    name: 'Measurable Target'
}, {
    id: 'crTool',
    name: 'Complete Response (CR)'
}, {
    id: 'unTool',
    name: 'Not Evaluable (NE)'
}, {
    id: 'exTool',
    name: 'Excluded (EX)'
}];

Template.nonTargetLesionDialog.helpers({
    lesionLocations: function() {
        return LesionLocations.find();
    },
    locationResponses: function() {
        return LocationResponses.find();
    },
    conversionOptions: function() {
        return conversionOptions;
    }
});
