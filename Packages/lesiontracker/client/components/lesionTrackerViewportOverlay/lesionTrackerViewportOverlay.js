// Use Aldeed's meteor-template-extension package to replace the
// default viewportOverlay template.
// See https://github.com/aldeed/meteor-template-extension
var defaultTemplate = 'viewportOverlay';
Template.lesionTrackerViewportOverlay.replaces(defaultTemplate);

// Add the TimepointName helper to the default template. The
// HTML of this template is replaced with that of lesionTrackerViewportOverlay
Template[defaultTemplate].helpers({
    timepointName: function() {
        var data = this;
        var study = Studies.findOne({
            studyInstanceUid: data.studyInstanceUid
        });

        if (!study) {
            return;
        }

        var timepoint = Timepoints.findOne({
            timepointId: study.timepointId
        });

        if (!timepoint) {
            return;
        }

        return getTimepointName(timepoint);
    }
});