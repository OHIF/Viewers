// Use Aldeed's meteor-template-extension package to replace the
// default viewportOverlay template.
// See https://github.com/aldeed/meteor-template-extension
var defaultTemplate = 'viewportOverlay';
Template.longitudinalViewportOverlay.replaces(defaultTemplate);

// Add the TimepointName helper to the default template. The
// HTML of this template is replaced with that of longitudinalViewportOverlay
Template[defaultTemplate].helpers({
    timepointName: function() {
        var data = this;
        const timepointApi = Template.instance().timepointApi;
        if (!timepointApi) {
        	return;
        }

        const timepoint = timepointApi.study(data.studyInstanceUid);
        if (!timepoint) {
            return;
        }

        return timepointApi.name(timepoint);
    }
});