
Template.studyDateList.onCreated(function(){

    // All studies of this patient at different dates
    this.patientStudies = [];
    this.selectedDate = "";
});


Template.studyDateList.onRendered(function(){

    // Add Study dates to Timepoints
    this.patientStudies.forEach(function(study) {
        Timepoints.insert({
            timepointID: uuid.v4(),
            timepointName: study.studyDate
        });
    });

    // Selected date option in combobox
    var self = this;
    $('#selectStudyDate option').filter(function () {
        if ($(this).html() === self.selectedDate) {
            $(this).prop('selected', true);
        }
    });

});

Template.studyDateList.helpers({
    patientStudies: function(){
        var self = Template.instance();

        var studyData = this.studies[0]; // study which is loaded in tab
        self.selectedDate = studyData.studyDate;

        // TODO= Fix this! This won't work to retrieve all studies
        // related to this patient. We will need to do a real search
        // since the WorklistStudies Collection only contains the studies on-screen

        var studies = WorklistStudies.find({}).fetch(); // All studies list
        var patientStudies = []; // Holds studies of patient

        // Get all studies of patient with patientID
        studies.forEach(function(study) {
            if (studyData.patientId === study.patientId) {
                patientStudies.push(study);
            }
        });

        self.patientStudies = patientStudies;
        return patientStudies;
    }
});


Template.studyDateList.events({
    'change select#selectStudyDate': function(e, template) {
        var studyInstanceUid = $(e.currentTarget).val();

        Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
            sortStudy(study);

            // Set "Selected" to false for the entire collection
            ViewerStudies.update({},
                {$set: {selected: false}},
                { multi: true });

            // Check if this study already exists in the ViewerStudies collection
            // of loaded studies. If it does, set it's 'selected' value to true.
            var existingStudy = ViewerStudies.findOne({studyInstanceUid: studyInstanceUid});
            if (existingStudy) {
                // Set the current finding in the collection to true
                ViewerStudies.update(existingStudy._id, {
                    $set: {selected: true}
                });
                return;
            }

            // If the study does not exist, add the 'selected' key to the object
            // with the value True, and insert it into the ViewerStudies Collection
            study.selected = true;
            ViewerStudies.insert(study);
        });
    }
});
