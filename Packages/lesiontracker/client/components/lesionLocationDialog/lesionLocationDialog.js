function closeHandler(dialog) {
    // Hide the lesion dialog
    $(dialog).css('display', 'none');

    // Remove the backdrop
    $(".removableBackdrop").remove();
}

// This event sets lesion number for new lesion
function setLesionNumberCallback(measurementData, eventData, doneCallback) {
    // Get the current element's timepointID from the study date metadata
    var element = eventData.element;
    var enabledElement = cornerstone.getEnabledElement(element);
    var imageId = enabledElement.image.imageId;

    var study = cornerstoneTools.metaData.get('study', imageId);
    var timepoint = Timepoints.findOne({timepointName: study.studyDate});
    if (!timepoint) {
        return;
    }

    measurementData.timepointID = timepoint.timepointID;

    // Get a lesion number for this lesion, depending on whether or not the same lesion previously
    // exists at a different timepoint
    var lesionNumber = LesionManager.getNewLesionNumber(measurementData.timepointID, isTarget=true);
    measurementData.lesionNumber = lesionNumber;

    // Set lesion number
    doneCallback(lesionNumber);
}

// This event determines whether or not to show the lesion dialog
// If there already exists a lesion with this specific lesion number,
// related to the chosen location.
function getLesionLocationCallback(measurementData, eventData) {
    Template.lesionLocationDialog.measurementData = measurementData;

    // Reset the doneCallback saved in the template so we don't call the change event's done callback
    Template.lesionLocationDialog.doneCallback = undefined;

    // Get the lesion location dialog
    var dialog = $("#lesionLocationDialog");
    Template.lesionLocationDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $(".removableBackdrop").one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Select the first option for now
    var selector = dialog.find("select.selectLesionLocation");
    selector.find("option:first").prop("selected", true);

    // Find out if this lesion number is already added in the lesion manager for another timepoint
    // If it is, stop here because we don't need the dialog.
    var locationUID = LesionManager.lesionNumberExists(measurementData);
    if (locationUID) {
        // Add an ID value to the tool data to link it to the Measurements collection
        measurementData.id = 'notready';

        measurementData.locationUID = locationUID;
        LesionManager.updateLesionData(measurementData);
        closeHandler();
        return;
    }
    // If it isn't, continue to open the dialog and have the user choose a lesion location

    // Show the lesion location dialog above
    var dialogProperty =  {
        top: eventData.currentPoints.page.y - dialog.outerHeight() - 40,
        left: eventData.currentPoints.page.x - dialog.outerWidth() / 2,
        display: 'block'
    };

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (isTouchDevice()) {
        // add dialogMobile class to provide a black,transparent background
        dialog.addClass("dialogMobile");
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
    }

    dialog.css(dialogProperty);
}

changeLesionLocationCallback = function(measurementData, eventData, doneCallback) {
    Template.lesionLocationDialog.measurementData = measurementData;
    Template.lesionLocationDialog.doneCallback = doneCallback;

    // Get the lesion location dialog
    var dialog = $("#lesionLocationRelabelDialog");
    Template.lesionLocationDialog.dialog = dialog;

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $(".removableBackdrop").one('mousedown touchstart', function() {
        closeHandler(dialog);
    });

    // Show the lesion location dialog above
    var dialogProperty = {
        display: 'block'
    };

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (!eventData || isTouchDevice()) {
        // add dialogMobile class to provide a black,transparent background
        dialog.addClass("dialogMobile");
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
    } else {
        dialogProperty.top = eventData.currentPoints.page.y - dialog.outerHeight() - 40;
        dialogProperty.left = eventData.currentPoints.page.x - dialog.outerWidth() / 2;
    }

    dialog.css(dialogProperty);

    var measurement = Measurements.findOne(measurementData.id);
    if (!measurement) {
        return;
    }

    LesionLocations.update({},
        {$set: {selected: false}},
        { multi: true });

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
};

var config = {
    setLesionNumberCallback: setLesionNumberCallback,
    getLesionLocationCallback: getLesionLocationCallback,
    changeLesionLocationCallback: changeLesionLocationCallback
};

cornerstoneTools.lesion.setConfiguration(config);

Template.lesionLocationDialog.events({
    'change .selectLesionLocation': function(e) {
        var measurementData = Template.lesionLocationDialog.measurementData;
        var doneCallback = Template.lesionLocationDialog.doneCallback;
        var dialog = Template.lesionLocationDialog.dialog;

        // Get the current value of the selector
        var selectedOptionId = e.currentTarget.value;

        // If the selected option is still the default (-1)
        // then stop here
        if (selectedOptionId < 0) {
            return;
        }

        // Get selected location data
        var locationObj = LesionLocations.findOne({_id: selectedOptionId});

        var id;
        var existingLocation = PatientLocations.findOne({location: locationObj.location});
        if (existingLocation) {
            id = existingLocation._id;
        } else {
            // Adds location data to PatientLocation and retrieve the location ID
            id = PatientLocations.insert({
                location: locationObj.location,
                locationId: locationObj._id
            });
        }

        // Add an ID value to the tool data to link it to the Measurements collection
        if (!measurementData.id) {
            measurementData.id = 'notready';

            // Link locationUID with active lesion measurementData
            measurementData.location = locationObj.location;
            measurementData.locationId = locationObj.id;
            measurementData.locationUID = id;

            /// Set the isTarget value to true, since this is the target-lesion dialog callback
            measurementData.isTarget = true;

            // Adds lesion data to timepoints array
            LesionManager.updateLesionData(measurementData);
        } else {
            Measurements.update(measurementData.id, {
                $set: {
                    location: locationObj.location,
                    locationId: locationObj.id,
                    locationUID: id
                }
            });
        }

        // Close the dialog
        closeHandler(dialog);

        if (doneCallback && typeof doneCallback === 'function') {
            doneCallback(measurementData);
        }
    },
    'click #removeLesion': function() {
        var measurementData = Template.lesionLocationDialog.measurementData;
        var doneCallback = Template.lesionLocationDialog.doneCallback;
        var dialog = Template.lesionLocationDialog.dialog;

        showConfirmDialog(function() {
            if (doneCallback && typeof doneCallback === 'function') {
                var deleteTool = true;
                doneCallback(measurementData, deleteTool);
            }
        });

        closeHandler(dialog);
    },
    'click #btnCloseLesionPopup': function() {
        var dialog = Template.lesionLocationDialog.dialog;
        closeHandler(dialog);
    },
    'keypress #lesionLocationDialog, keypress #lesionLocationRelabelDialog': function(e) {
        var dialog = Template.lesionLocationDialog.dialog;

        // If Enter is pressed, close the dialog
        if (e.which === 13) {
            closeHandler(dialog);
        }
    }
});

Template.lesionLocationDialog.helpers({
    'lesionLocations': function() {
        return LesionLocations.find();
    }
});