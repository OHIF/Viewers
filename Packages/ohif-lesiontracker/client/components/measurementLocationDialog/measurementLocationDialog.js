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
        if (!timepointApi) {
            return;
        }

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

// This event determines whether or not to show the measurement dialog
// If there already exists a measurement with this specific measurement number,
// related to the chosen location.
function getMeasurementLocationCallback(measurementData, eventData) {
    return;
    Template.measurementLocationDialog.measurementData = measurementData;

    // Reset the doneCallback saved in the template so we don't call the change event's done callback
    Template.measurementLocationDialog.doneCallback = undefined;

    // Get the measurement location dialog
    var dialog = $('#measurementLocationDialog');
    Template.measurementLocationDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Select the first option for now
    var selector = dialog.find('select.selectMeasurementLocation');
    selector.find('option:first').prop('selected', true);

    // Find out if this measurement number is already added in the measurement manager for another timepoint
    // If it is, stop here because we don't need the dialog.
    var locationUID = OHIF.measurements.MeasurementManager.getLocationIdIfMeasurementExists(measurementData);
    if (locationUID) {
        // Add an ID value to the tool data to link it to the Measurements collection
        measurementData.id = 'notready';

        measurementData.locationUID = locationUID;
        MeasurementManager.updateMeasurementData(measurementData);
        closeHandler();
        return;
    }
    // If it isn't, continue to open the dialog and have the user choose a measurement location

    // Show the measurement location dialog above
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
    }

    dialog.css(dialogProperty);
    dialog.focus();
}

changeMeasurementLocationCallback = function(measurementData, eventData, doneCallback) {
    return;
    Template.measurementLocationDialog.measurementData = measurementData;
    Template.measurementLocationDialog.doneCallback = doneCallback;

    // Get the measurement location dialog
    var dialog = $('#measurementLocationRelabelDialog');

    // Show/Hide Convert To NonTarget option in measurementLocationRelabelDialog
    if (measurementData.toolType === 'bidirectional') {
        dialog.find('#convertToNonTarget').css('visibility', 'visible');
    } else {
        dialog.find('#convertToNonTarget').css('visibility', 'hidden');
    }

    Template.measurementLocationDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Show the measurement location dialog above
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

    MeasurementLocations.update({},
        {
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
};

Template.measurementLocationDialog.onCreated(() => {
    const instance = Template.instance();
    const measurementTypeId = 'targets';
    const measurementApi = instance.data.measurementApi;
    const timepointApi = instance.data.timepointApi;

    const config = {
        setMeasurementNumberCallback: getSetMeasurementNumberCallbackFunction(measurementTypeId, measurementApi, timepointApi),
        getMeasurementLocationCallback: getMeasurementLocationCallback,
        changeMeasurementLocationCallback: changeMeasurementLocationCallback
    };

    cornerstoneTools.bidirectional.setConfiguration(config);

    // Set CR-Tool, UN-Tool, EX-Tool configurations
    cornerstoneTools.crTool.setConfiguration(config);
    cornerstoneTools.exTool.setConfiguration(config);
    cornerstoneTools.unTool.setConfiguration(config);

});

Template.measurementLocationDialog.events({
    'change .selectMeasurementLocation': function(e) {
        var measurementData = Template.measurementLocationDialog.measurementData;
        var doneCallback = Template.measurementLocationDialog.doneCallback;
        var dialog = Template.measurementLocationDialog.dialog;

        // Get the current value of the selector
        var selectedOptionId = e.currentTarget.value;

        // If the selected option is still the default (-1)
        // then stop here
        if (selectedOptionId < 0) {
            return;
        }

        // Get selected location data
        var locationObj = MeasurementLocations.findOne({
            _id: selectedOptionId
        });

        Measurements.update(measurementData.id, {
            $set: {
                locationId: locationObj.id,
            }
        });

        // Close the dialog
        closeHandler(dialog);

        if (doneCallback && typeof doneCallback === 'function') {
            doneCallback(measurementData);
        }
    },
    'click #removeMeasurement': function() {
        var measurementData = Template.measurementLocationDialog.measurementData;
        var doneCallback = Template.measurementLocationDialog.doneCallback;
        var dialog = Template.measurementLocationDialog.dialog;

        var options = {
            keyPressAllowed: false,
            title: 'Remove measurement?',
            text: 'Are you sure you would like to remove the entire measurement?'
        };

        showConfirmDialog(function() {
            if (doneCallback && typeof doneCallback === 'function') {
                var deleteTool = true;
                doneCallback(measurementData, deleteTool);
            }
        }, options);

        closeHandler(dialog);
    },
    'click #convertToNonTarget': function() {
        var measurementData = Template.measurementLocationDialog.measurementData;
        var dialog = Template.measurementLocationDialog.dialog;

        const instance = Template.instance();
        const measurementApi = instance.data.measurementApi;
        OHIF.measurementtracker.convertToNonTarget(measurementApi, measurementData);

        closeHandler(dialog);
    },
    'click #btnCloseMeasurementPopup': function() {
        var dialog = Template.measurementLocationDialog.dialog;
        closeHandler(dialog);
    },
    'keydown #measurementLocationDialog, keydown #measurementLocationRelabelDialog': function(e) {
        var dialog = Template.measurementLocationDialog.dialog;

        // If Esc or Enter are pressed, close the dialog
        if (e.which === keys.ESC || e.which === keys.ENTER) {
            closeHandler(dialog);
            return false;
        }
    }
});

Template.measurementLocationDialog.helpers({
    measurementLocations() {
        return MeasurementLocations.find();
    }
});
