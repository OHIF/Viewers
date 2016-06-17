Template.studyBrowser.helpers({
    studies() {
        return ViewerStudies.find({
            selected: true
        });
    }
});
