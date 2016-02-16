Template.lesionTableTimepointHeader.helpers({
    'timepointName': function() {
        var timepoint = this;
        return getTimepointName(timepoint);
    },
    isLoaded: function() {
        Session.get('NewSeriesLoaded');

        log.info('ViewerData changed, check for displayed timepoints');

        var timepoint = this;

        var isLoaded = false;
        var viewports = $('.imageViewerViewport').not('.empty');
        viewports.each(function(index, element) {
            var enabledElement = cornerstone.getEnabledElement(element);
            if (!enabledElement || !enabledElement.image) {
                return;
            }

            var study = cornerstoneTools.metaData.get('study', enabledElement.image.imageId);

            var currentTimepoint = Timepoints.findOne({
                studyInstanceUids: {
                    $in: [study.studyInstanceUid]
                }
            });

            if (currentTimepoint && currentTimepoint._id === timepoint._id) {
                isLoaded = true;

                // Break the loop
                return false;
            }
        });

        return isLoaded;
    }
});