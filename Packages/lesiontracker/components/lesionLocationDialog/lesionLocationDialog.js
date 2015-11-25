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
    var lesionNumber = measurementManagerDAL.getNewLesionNumber(measurementData.timepointID, isTarget=true);
    measurementData.lesionNumber = lesionNumber;

    // Set lesion number
    doneCallback(lesionNumber);
}

// This event determines whether or not to show the lesion dialog
// If there already exists a lesion with this specific lesion number,
// related to the chosen location.
function getLesionLocationCallback(measurementData, eventData) {
    // Get the lesion location dialog
    var lesionDialog = $("#lesionLocationDialog");

    // Find the select option box
    var selector = lesionDialog.find("select#selectLesionLocation");

    // Find out if this lesion number is already added in the lesion manager for another timepoint
    // If it is, stop here because we don't need the dialog.
    var locationUID = measurementManagerDAL.lesionNumberExists(measurementData);
    if (locationUID) {
        measurementData.locationUID = locationUID;
        measurementManagerDAL.updateTimepointData(measurementData);
        closeHandler();
        return;
    }
    // If it isn't, continue to open the dialog and have the user choose a lesion location

    // Attach close handler if the user clicks the close button
    var close = lesionDialog.find("#btnCloseLesionPopup");
    close.off('click');
    close.on('click', function() {
        closeHandler();
    });

    function closeHandler() {
        // Hide the lesion dialog
        lesionDialog.css('display', 'none');

        // Select the first option for the next time the dialog is opened
        selector.find("option:first").prop("selected", true);

    }

    // Attach keypress handlers so the user can close with the Enter button
    lesionDialog.off("keypress");
    lesionDialog.on('keypress', keyPressHandler);

    // This is the keypress callback function
    function keyPressHandler(e) {
        // If Enter is pressed, close the dialog
        if (e.which === 13) {
            closeHandler();
        }
    }

    // Show the lesion location dialog above

    var dialogProperty =  {
        top: eventData.currentPoints.page.y - lesionDialog.outerHeight() - 40,
        left: eventData.currentPoints.page.x - lesionDialog.outerWidth() / 2,
        display: 'block'
    };

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (isTouchDevice()) {
        // add dialogMobile class to provide a black,transparent background
        $(lesionDialog).addClass("dialogMobile");
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
        $(".lesionContentWrapper").css({
            left: ($(window).width() - $(".lesionContentWrapper").width()) / 2,
            top: ($(window).height() - $(".lesionContentWrapper").height()) / 2

        });
    }

    lesionDialog.css(dialogProperty);

    // Attach a callback for the select box
    selector.off('change');
    selector.on('change', function(e) {
        // Get the current value of the selector
        var selectedOptionId = this.value;

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
            id = PatientLocations.insert({location: locationObj.location});
        }

        // Link locationUID with active lesion measurementData
        measurementData.locationUID = id;

        /// Set the isTarget value to true, since this is the target-lesion dialog callback
        measurementData.isTarget = true;

        // Adds lesion data to timepoints array
        measurementManagerDAL.addLesionData(measurementData);

        // Close the dialog
        closeHandler();
    });
}

function changeLesionLocationCallback(measurementData, eventData, doneCallback) {
    doneCallback(prompt('Change your lesion location:'));
}

var config = {
    setLesionNumberCallback: setLesionNumberCallback,
    getLesionLocationCallback: getLesionLocationCallback,
    changeLesionLocationCallback: changeLesionLocationCallback
};

cornerstoneTools.lesion.setConfiguration(config);


LesionLocations = new Meteor.Collection(null);

LesionLocations.insert({
    location: "Brain Brainstem",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Cerebellum Left",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Cerebrum Left",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Cerebrum Right",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Multiple Sites",
    hasDescription: false,
    description: ""
});

Template.lesionLocationDialog.helpers({
    'lesionLocations': function() {
        return LesionLocations.find();
    }
});