Template.studyBrowser.helpers({
    studies : function() {
        return ViewerStudies.find({selected: true});
    }
});