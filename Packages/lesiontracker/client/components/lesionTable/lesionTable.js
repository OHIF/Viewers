Template.lesionTable.helpers({
    'measurement': function() {
        return Measurements.find({}, {
            sort: {
                lesionNumber: 1
            }
        });
    },
    'timepoints': function() {
        return Timepoints.find({}, {
            sort: {
                timepointName: 1
            }
        });
    }
});

Template.lesionTable.events({
    'click table#tblLesion tbody tr': function(e, template) {
        // Retrieve the lesion id from the DOM data for this row
        var measurementId = $(e.currentTarget).data('measurementid');

        activateLesion(measurementId, template.data);
    },
    'mousedown div#dragbar': function(e, template) {
        var pY = e.pageY;
        var draggableParent = $(e.currentTarget).parent();
        var startHeight = draggableParent.height();
        template.dragging.set(true);

        $(document).on('mouseup', function(e) {
            template.dragging.set(false);
            $(document).off('mouseup').off('mousemove');
        });

        $(document).on('mousemove', function(e) {
            var topPosition = e.pageY - pY;
            var newHeight = startHeight - topPosition;

            // Min lesion table height = 5px
            if (newHeight < 5) {
                return;
            }

            draggableParent.css({
                top: topPosition,
                height: newHeight
            });

            var viewportAndLesionTableHeight = $("#viewportAndLesionTable").height();
            var newPercentageHeightofLesionTable = (startHeight - topPosition) / viewportAndLesionTableHeight * 100;
            var newPercentageHeightofViewermain = 100 - newPercentageHeightofLesionTable;
            $(".viewerMain").height(newPercentageHeightofViewermain + "%");

            // Resize viewport
            resizeViewportElements();
        });
    }
});

Template.lesionTable.onCreated(function() {
    this.dragging = new ReactiveVar(false);
});

Template.lesionTable.onRendered(function() {
    var self = this;

    // Track ViewerData to get active timepoints
    // Put a visual indicator (<) in timepoint header in lesion table for active timepoints
    // timepointLoaded property is used to put indicator for loaded timepoints in viewport
    self.autorun(function() {
        // Get study dates of imageViewerViewport elements
        var loadedStudyDates = {
            patientId: "",
            dates: []
        };

        $(".imageViewerViewport").each(function(viewportIndex, element) {
            var enabledElement = cornerstone.getEnabledElement(element);
            if (!enabledElement || !enabledElement.image) {
                return;
            }

            var imageId = enabledElement.image.imageId;
            var study = cornerstoneTools.metaData.get('study', imageId);
            var studyDate = study.studyDate;
            loadedStudyDates.patientId = study.patientId;

            // Check whether or not studyDate has been added before
            if (loadedStudyDates.dates.indexOf(studyDate) < 0) {
                loadedStudyDates.dates.push(studyDate);
            }
        });

        // If study date is loaded into viewport, set timepointLoaded property in Timepoints collection as true
        // Else set timepointLoaded property as false
        if (loadedStudyDates.dates.length) {
            var timepoints = Timepoints.find({
                patientId: loadedStudyDates.patientId
            }).fetch();

            timepoints.forEach(function(timepoint) {
                var timepointLoaded = false;
                if (loadedStudyDates.dates.indexOf(timepoint.timepointName) > -1) {
                    timepointLoaded = true;
                }

                Timepoints.update(timepoint._id, {
                    $set: {
                        timepointLoaded: timepointLoaded
                    }
                });
            });
        }
    });
});