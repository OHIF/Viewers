Template.studyTimepointBrowser.helpers({
    timepoints: function() {
        const sort = {
            sort: {
                earliestDate: -1
            }
        };
        return Timepoints.find({}, sort);
    }
});
