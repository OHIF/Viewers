// Get enabled elements in viewport
// Returns enabled elements with associated elements as object array
function getEnabledElementsInViewport() {
    var enabledElementsInViewport = [];

    $(".imageViewerViewport").each(function(index, element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        if (!enabledElement) {
            return;
        }

        enabledElementsInViewport.push({element: element, enabledElement: enabledElement});
    });

    return enabledElementsInViewport;
}

// Switch to the image of the correct image index
// Activate the selected measurement on the switched image (color to be green)
// Deactivate all other measurements on the switched image (color to be white)
function activateMeasurementsInRelatedImages(timepoints, lesionNumber, isTarget) {

    //TODO: This is a bad hack! We need to listen an event of the element and handle it when rendering of the element is completed
    //TODO:  we can switch to the related image and activate the selected measurement on the switched image.
    var intervalListener = setInterval(function() {
        window.clearInterval(intervalListener);

        var enabledElementsInViewport = getEnabledElementsInViewport();

        for(var i = 0; i < enabledElementsInViewport.length; i++) {
            var element = enabledElementsInViewport[i].element;
            var enabledElement = enabledElementsInViewport[i].enabledElement;
            var timepointObject = getTimepointObject(timepoints, enabledElement);

            if (timepointObject === undefined) {
                continue;
            }

            // Defines event data
            var eventData = {
                enabledElement: enabledElement,
                lesionData: {
                    isTarget: isTarget,
                    lesionNumber: lesionNumber,
                    imageId: timepointObject.imageId,
                    seriesInstanceUid: timepointObject.seriesInstanceUid,
                    studyInstanceUid: timepointObject.studyInstanceUid
                },
                type: "active"
            };

            // If isTarget = false, this measurement is nonTarget measurement
            // Activate related nonTarget measurement
            // Deactivate all target measurements to activate only nonTarget measurement
            if (!isTarget) {
                $(element).trigger("NonTargetToolSelected", eventData);

                // Deactivate lesion tool measurements
                eventData.type = "inactive";

                $(element).trigger("LesionToolSelected", eventData);

            } else {
                // Trigger event for target measurements
                $(element).trigger("LesionToolSelected", eventData);

                // Deactivate nonTarget tool measurements
                eventData.type = "inactive";

                // Triggger event for nonTarget measurements
                // Inactivate all nonTarget measurements if any measurement is active
                $(element).trigger("NonTargetToolSelected", eventData);
            }
        }
    }, 100);
}

// Returns timepoint object based on timepoint id of the enabled element
function getTimepointObject(timepoints, enabledElement) {
    var imageId = enabledElement.image.imageId;
    var study = cornerstoneTools.metaData.get('study', imageId);
    var series = cornerstoneTools.metaData.get('series', imageId);

    // Get the timepointID related to the image viewer viewport
    // from the DOM itself. This will be changed later when a
    // real association between viewports and timepoints is created.
    var timepoint = Timepoints.findOne({timepointName: study.studyDate});
    if (!timepoint) {
        return;
    }
    var timepointID = timepoint.timepointID;

    var timepointObject = timepoints[timepointID];

    if (timepointObject === undefined) {
        return;
    }

    if (!timepointObject ) {
        timepointObject = {}
    }

    return timepointObject;
}

// Activate selected lesions when lesion table row is clicked
function updateLesions(e) {
    // lesionNumber of measurement = id of row
    var lesionNumber = parseInt($(e.currentTarget).attr("id"), 10);

    // TODO= Clarify this
    // Get Target column value
    // Search and update data according to target type
    var isTarget = $(e.currentTarget).find('td').eq(2).html().trim() === 'N'?false:true;

    // Find data for specific lesion
    var measurementData = Measurements.findOne({
        lesionNumber: lesionNumber,
        isTarget: isTarget
    });

    if (!measurementData) {
        return;
    }

    var timepoints = measurementData.timepoints;
    var enabledElementsInViewport = getEnabledElementsInViewport();

    //  Render related series
    for(var i = 0; i < enabledElementsInViewport.length; i++) {
        var element = enabledElementsInViewport[i].element;
        var enabledElement = enabledElementsInViewport[i].enabledElement;

        var timepointObject = getTimepointObject(timepoints, enabledElement);

        if (timepointObject === undefined || timepointObject.seriesInstanceUid === "") {
            continue;
        }

        var newSeriesData = {
            seriesInstanceUid: timepointObject.seriesInstanceUid,
            studyInstanceUid: timepointObject.studyInstanceUid
        };

        // Rerender the viewport using data for new series
        rerenderViewportWithNewSeries(element, newSeriesData);
    }

    // Activate selected measurements on the rendered series
    activateMeasurementsInRelatedImages(timepoints, lesionNumber, isTarget);
}

Template.lesionTable.helpers({
    'measurement': function() {
        return Measurements.find({}, {sort: {number: 1}});
    },
    'timepoints': function() {
        return Timepoints.find();
    }
});

Template.lesionTable.events({
    'click table#tblLesion tbody tr': function(e) {
        updateLesions(e);
    }
});