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

    // TODO: Get patientId
    // TODO: add measurement data according to patientId to get correct lesion number for each patient

    measurementData.timepointID = timepoint.timepointID;

    // Get a lesion number for this lesion, depending on whether or not the same lesion previously
    // exists at a different timepoint
    var lesionNumber = measurementManagerDAL.getNewLesionNumber(measurementData.timepointID, isTarget=false);
    measurementData.lesionNumber = lesionNumber;

    // Set lesion number
    doneCallback(lesionNumber);
}

// This event determines whether or not to show the Non-Target lesion dialog
// If there already exists a lesion with this specific lesion number,
// related to the chosen location.

function getNonTargetLesionLocationCallback(measurementData, eventData) {

    // Get the non-target lesion location dialog
    var nonTargetlesionDialog = $("#nonTargetLesionLocationDialog");

    // Find the select option box
    var selectorLocation = nonTargetlesionDialog.find("select#selectNonTargetLesionLocation");
    var selectorResponse = nonTargetlesionDialog.find("select#selectNonTargetLesionLocationResponse");

    // OK button
    var btnOK = nonTargetlesionDialog.find("button#nonTargetLesionOK");


    // If selector location is disabled, make it enable
    enableLocationSelection();

    // Find out if this lesion number is already added in the lesion manager for another timepoint
    // If it is, disable selector location
    var locationUID = measurementManagerDAL.lesionNumberExists(measurementData);
    if (locationUID) {
        measurementData.locationUID = locationUID;
        // Disable the selection of a new location
        disableLocationSelection(measurementData.locationUID);
    }

    // Disable selector location to prevent selecting a new location
    function disableLocationSelection(locationUID) {
        var locationName = measurementManagerDAL.getLocationName(locationUID);
        selectorLocation.find('option').each(function()
        {
            if ($(this).text() === locationName) {
                // Select location in locations dropdown list
                selectorLocation.find('option').eq($(this).index()).prop("selected", true);
                return;
            }
        });

        selectorLocation.prop("disabled", true);
    }

    // Enable selector location
    function enableLocationSelection() {
        selectorLocation.removeAttr("disabled");
    }

    function closeHandler() {

        // Hide the lesion dialog
        nonTargetlesionDialog.css('display', 'none');
        // Enable selector location
        enableLocationSelection();

        // Get the current value of the select option box
        selectorLocation.find("option:first").prop("selected", "selected");
        selectorResponse.find("option:first").prop("selected", "selected");

    }

    // Attach keypress handlers so the user can close with the Enter button
    nonTargetlesionDialog.off("keypress");
    nonTargetlesionDialog.on('keypress', keyPressHandler);

    // This is the keypress callback function
    function keyPressHandler(e) {
        // If Enter is pressed, close the dialog
        if (e.which === 13) {
            closeHandler();
        }
    }

    // Show the nonTargetLesion dialog above
    var dialogProperty =  {
        top: eventData.currentPoints.page.y,
        left: eventData.currentPoints.page.x,
        display: 'block'
    };

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (isTouchDevice()) {
        // add dialogMobile class to provide a black,transparent background
        $(nonTargetlesionDialog).addClass("dialogMobile");
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
        $(".contentWrapper").css({
            left: ($(window).width() - $(".contentWrapper").width()) / 2,
            top: ($(window).height() - $(".contentWrapper").height()) / 2

        });
    }

    nonTargetlesionDialog.css(dialogProperty);

    // Click OK button
    // Add lesion to lesion table
    btnOK.off('click');
    btnOK.on('click', function(e) {
        // Get the current value of the selector
        var selectedOptionId = selectorLocation.find("option:selected").val();
        var responseOptionCode = nonTargetlesionDialog.find("select#selectNonTargetLesionLocationResponse  option:selected").val();

        // If the selected option is still the default (-1)
        // then stop here
        if (selectedOptionId < 0) {
            return;
        }

        // If the selected response option is still the default (-1)
        // then stop here
        if (responseOptionCode < 0) {
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
        measurementData.isTarget = false;

        // measurementText is set from location response list
        measurementData.measurementText = responseOptionCode;

        // Adds lesion data to timepoints array
        measurementManagerDAL.addLesionData(measurementData);

        // Close the dialog
        closeHandler();
    });
}

function changeNonTargetLesionLocationCallback(measurementData, eventData, doneCallback) {
    doneCallback(prompt('Change your lesion location:'));
}

var config = {
    setLesionNumberCallback: setLesionNumberCallback,
    getNonTargetLesionLocationCallback: getNonTargetLesionLocationCallback,
    changeNonTargetLesionLocationCallback: changeNonTargetLesionLocationCallback
};

cornerstoneTools.nonTarget.setConfiguration(config);


LocationResponses = new Meteor.Collection(null);

LocationResponses.insert(
    {
        text: "Complete response",
        code: "CR",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Progressive disease",
        code: "PD",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Complete response",
        code: "CR",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Stable disease",
        code: "SD",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Non-measurable",
        code: "NM",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Unknown",
        code: "UN",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Not Evaluable",
        code: "NE",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Non-CR/Non-PD",
        code: "NN",
        description: ""
    }
);
LocationResponses.insert(
    {
        text: "Excluded",
        code: "EX",
        description: ""
    }
);

Template.nonTargetLesionDialog.helpers({
    'lesionLocations': function() {
        return LesionLocations.find();
    },
    'locationResponses': function() {
        return LocationResponses.find();
    }
});