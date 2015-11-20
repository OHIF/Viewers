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

    $(".imageViewerViewport").each(function(index, element) {
        // Get the timepointID related to the image viewer viewport
        // from the DOM itself. This will be changed later when a
        // real association between viewports and timepoints is created.
        var enabledElement = cornerstone.getEnabledElement(element);
        if (!enabledElement) {
            return;
        }
        var study = cornerstoneTools.metaData.get('study', enabledElement.image.imageId);
        var series = cornerstoneTools.metaData.get('series', enabledElement.image.imageId);

        var timepoint = Timepoints.findOne({timepointName: study.date});
        if (!timepoint) {
            return;
        }
        var timepointID = timepoint.timepointID;

        var timepointObject = timepoints[timepointID];

        // TODO: Bring series in correct imageViewport

        if (timepointObject.seriesInstanceUid !== series.instanceUid) {
            console.log("not in same series");
            var newSeriesData  = {
                seriesInstanceUid: timepointObject.seriesInstanceUid,
                studyInstanceUid: timepointObject.studyInstanceUid
            };

            // Rerender the viewport using the drag and drop data
             rerenderViewportWithNewSeries(element, newSeriesData);
        }

        // Defines event data
        var eventData = {
            enabledElement: cornerstone.getEnabledElement(element),
            lesionData: {
                isTarget: isTarget,
                lesionNumber: lesionNumber,
                imageId: timepointObject.imageId,
                seriesInstanceUid: timepointObject.seriesInstanceUid,
                studyInstanceUid: timepointObject.studyInstanceUid
            },
            type: "active"
        };

        // When measurement column is null, deactivate other measurements in the enabledElement
        if (timepointObject.longestDiameter === "") {
            eventData.type = "inactive";
        }

        // If isTarget = false, this measurement is nonTarget measurement
        // Activate related nonTarget measurement
        // Deactivate all target measurements to activate only nonTarget measurement
        if (!isTarget) {
            $(element).trigger("NonTargetToolSelected", eventData);

            // Deactivate lesion tool measurements
            eventData.type = "inactive";
            $(element).trigger("LesionToolSelected", eventData);
            return;
        }

        // Trigger event for target measurements
        $(element).trigger("LesionToolSelected", eventData);

        // Deactivate nonTarget tool measurements
        eventData.type = "inactive";

        // Triggger event for nonTarget measurements
        // Inactivate all nonTarget measurements if any measurement is active
        $(element).trigger("NonTargetToolSelected", eventData);

    });
}

Template.lesionTable.helpers({
    'measurement': function() {
        return Measurements.find();
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