Template.lesionTable.helpers({
    measurement: function() {
        // All Targets shall be listed first followed by Non-Targets
        return Measurements.find({}, {
            sort: {
                isTarget: -1,
                lesionNumberAbsolute: 1
            }
        });
    },
    timepoints: function() {
        return Timepoints.find({}, {
            sort: {
                latestDate: 1
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

            var viewportAndLesionTableHeight = $('#viewportAndLesionTable').height();
            var newPercentageHeightofLesionTable = (startHeight - topPosition) / viewportAndLesionTableHeight * 100;
            var newPercentageHeightofViewermain = 100 - newPercentageHeightofLesionTable;
            $('.viewerMain').height(newPercentageHeightofViewermain + '%');

            // Resize viewport
            resizeViewportElements();
        });
    }
});

Template.lesionTable.onCreated(function() {
    this.dragging = new ReactiveVar(false);
});

// Temporary until we have a real window manager with events for series/study changed
Session.setDefault('NewSeriesLoaded', false);

Template.lesionTable.onRendered(function() {
    // Find the first measurement by Lesion Number
    var firstLesion = Measurements.findOne({}, {
        sort: {
            lesionNumber: 1
        }
    });

    // Create an object to store the ContentId inside
    var templateData = {
        contentId: Session.get('activeContentId')
    };

    // Activate the first lesion
    if (firstLesion) {
        activateLesion(firstLesion._id, templateData);
    }
});
