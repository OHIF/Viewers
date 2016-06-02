Template.studyTimepoint.helpers({
    studies: function(timepoint) {
        const query = {
            selected: true
        };
        return ViewerStudies.find(query);
    }
});
