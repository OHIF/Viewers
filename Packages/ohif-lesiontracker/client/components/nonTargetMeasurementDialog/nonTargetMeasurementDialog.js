import { OHIF } from 'meteor/ohif:core';

function closeHandler(dialog) {
    // Hide the measurement dialog
    $(dialog).css('display', 'none');

    // Remove the backdrop
    $('.removableBackdrop').remove();

    // Restore the focus to the active viewport
    setFocusToActiveViewport();
}

// This event sets measurement number for new measurement
function getSetMeasurementNumberCallbackFunction(measurementTypeId, measurementApi, timepointApi) {
    return (measurementData, eventData, doneCallback) => {
        // Get the current element's timepointId from the study date metadata
        var element = eventData.element;
        var enabledElement = cornerstone.getEnabledElement(element);
        var imageId = enabledElement.image.imageId;

        var study = cornerstoneTools.metaData.get('study', imageId);

        // Find the relevant timepoint given the current study
        var timepoint = timepointApi.study(study.studyInstanceUid)[0];
        if (!timepoint) {
            return;
        }

        // Get a measurement number for this measurement, depending on whether or not the same measurement previously
        // exists at a different timepoint
        const timepointId = timepoint.timepointId;
        const collection = measurementApi[measurementTypeId];
        const measurementNumber = OHIF.measurements.MeasurementManager.getNewMeasurementNumber(timepointId, collection, timepointApi);
        measurementData.measurementNumber = measurementNumber;

        // Set measurement number
        doneCallback(measurementNumber);
    };
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

// This event determines whether or not to show the Non-Target measurement dialog
// If there already exists a measurement with this specific measurement number,
// related to the chosen location.
function getMeasurementLocationCallback(measurementData, eventData) {
    return 'Test Location';
    Template.nonTargetMeasurementDialog.measurementData = measurementData;

    // Get the non-target measurement location dialog
    var dialog = $('#nonTargetMeasurementLocationDialog');
    Template.nonTargetMeasurementDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Find the select option box
    var selectorLocation = dialog.find('select#selectNonTargetMeasurementLocation');

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

    // Find out if this measurement number is already added in the measurement manager for another timepoint
    // If it is, disable selector location
    var locationId = OHIF.measurements.MeasurementManager.getLocationIdIfMeasurementExists(measurementData);
    if (locationId) {
        // Add an ID value to the tool data to link it to the Measurements collection
        measurementData.id = 'notready';

        measurementData.locationId = locationId;

        // Disable the selection of a new location
        disableLocationSelection(measurementData.locationId);
    }

    // Disable selector location to prevent selecting a new location
    function disableLocationSelection(locationId) {
        var locationObject = MeasurementLocations.findOne({
                id: locationId
            });

        if (!locationObject) {
            return;
        }

        selectorLocation.find('option[value="' + locationObject._id + '"]').prop('selected', true);
        selectorLocation.prop('disabled', true);
    }

    // Show the nonTargetMeasurement dialog above
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
    Template.nonTargetMeasurementDialog.measurementData = measurementData;
    Template.nonTargetMeasurementDialog.doneCallback = doneCallback;

    // Get the non-target measurement location dialog
    var dialog = $('#nonTargetMeasurementRelabelDialog');
    Template.nonTargetMeasurementDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Find the select option box
    var selectorLocation = dialog.find('select#selectNonTargetMeasurementLocation');
    var selectorResponse = dialog.find('select#selectNonTargetMeasurementLocationResponse');

    selectorLocation.find('option:first').prop('selected', 'selected');
    selectorResponse.find('option:first').prop('selected', 'selected');

    // Allow location selection
    selectorLocation.removeAttr('disabled');

    // Show the nonTargetMeasurement dialog above
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

    MeasurementLocations.update({}, {
        $set: {
            selected: false
        }
    }, {
        multi: true
    });

    var currentLocation = MeasurementLocations.findOne({
        id: measurement.locationId
    });

    if (!currentLocation) {
        return;
    }

    MeasurementLocations.update(currentLocation._id, {
        $set: {
            selected: true
        }
    });

    var response = measurement.timepoints[measurementData.timepointId].response;
    selectNonTargetResponse(response);
};

Template.nonTargetMeasurementDialog.onCreated(() => {
    const instance = Template.instance();
    const measurementTypeId = 'nonTargets';
    const measurementApi = instance.data.measurementApi;
    const timepointApi = instance.data.timepointApi;

    const config = {
        setMeasurementNumberCallback: getSetMeasurementNumberCallbackFunction(measurementTypeId, measurementApi, timepointApi),
        getMeasurementLocationCallback: getMeasurementLocationCallback,
        changeMeasurementLocationCallback: changeMeasurementLocationCallback
    };

    //cornerstoneTools.nonTarget.setConfiguration(config);
});

Template.nonTargetMeasurementDialog.events({
    'change #selectNonTargetMeasurementLocationResponse': function(e) {
        var responseCode = $(e.currentTarget).val();
        selectNonTargetResponse(responseCode);
    },
    'click #nonTargetMeasurementOK': function() {
        var dialog = Template.nonTargetMeasurementDialog.dialog;
        var measurementData = Template.nonTargetMeasurementDialog.measurementData;

        // Find the select option box
        var selectorLocation = dialog.find('select#selectNonTargetMeasurementLocation');

        // Get the current value of the selector
        var selectedOptionId = selectorLocation.find('option:selected').val();

        // If the selected option is still the default (-1)
        // then stop here
        if (selectedOptionId < 0) {
            return;
        }

        // Get selected location data
        var locationObj = MeasurementLocations.findOne({
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

        /// Set the isTarget value to true, since this is the target-measurement dialog callback
        measurementData.isTarget = false;

        // Response is set from location response list
        measurementData.response = LocationResponses.findOne({
            selected: true
        }).code;

        // Adds measurement data to timepoints array
        MeasurementManager.updateMeasurementData(measurementData);

        // Close the dialog
        closeHandler(dialog);
    },
    'click #removeMeasurement': function() {
        var measurementData = Template.nonTargetMeasurementDialog.measurementData;
        var doneCallback = Template.nonTargetMeasurementDialog.doneCallback;
        var dialog = Template.nonTargetMeasurementDialog.dialog;

        showConfirmDialog(function() {
            if (doneCallback && typeof doneCallback === 'function') {
                var deleteTool = true;
                doneCallback(measurementData, deleteTool);
            }
        });

        closeHandler(dialog);
    },
    'click #btnCloseMeasurementPopup': function() {
        var dialog = Template.nonTargetMeasurementDialog.dialog;
        closeHandler(dialog);
    },
    'click a.convertNonTarget': function(evt) {
        var measurementData = Template.nonTargetMeasurementDialog.measurementData;
        var dialog = Template.nonTargetMeasurementDialog.dialog;

        var button = $(evt.currentTarget);
        var toolType = button.data('type');

        convertNonTarget(measurementData, toolType);

        closeHandler(dialog);
    },
    'keydown #measurementLocationDialog, keydown #measurementLocationRelabelDialog': function(e) {
        var dialog = Template.nonTargetMeasurementDialog.dialog;

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

Template.nonTargetMeasurementDialog.helpers({
    measurementLocations: function() {
        return MeasurementLocations.find();
    },
    locationResponses: function() {
        return LocationResponses.find();
    },
    conversionOptions: function() {
        return conversionOptions;
    }
});
