
Template.studyDateList.onCreated(function(){

    // All studies of this patient at different dates
    this.patientStudies = [];
    this.selectedDate = "";
});

function cleanTimepoints() {
    var timepoints = Timepoints.find();
    timepoints.forEach(function (timepoint) {
        Timepoints.remove({_id: timepoint._id});
    });
}

Template.studyDateList.onRendered(function(){
    //cleanTimepoints();

    // Add Study dates to Timepoints
    this.patientStudies.forEach(function(study) {
        Timepoints.insert({
            timepointID: uuid.v4(),
            timepointName: study.studyDate
        });
    });

    // Selected date option
    $('#selectStudyDate option[value="'+this.selectedDate+'"]').prop('selected', true);

});

Template.studyDateList.helpers({
    patientStudies: function(){
        var self = Template.instance();

        var studyData = this.studies[0]; // study which is loaded in tab
        self.selectedDate = studyData.studyDate;
        var studies = Studies.find().fetch(); // All studies list
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
        var selector = e.currentTarget;
        var selectedStudyDate = $(selector).val();
        var patientStudies = template.patientStudies;
        var studies = []; // all studies that has the same date and get with studyInstanceUId
        patientStudies.forEach(function(study) {
            if(study.studyDate === selectedStudyDate) {
                studies.push(study);
            }
        });

        studies.forEach(function(studyData) {
            var studyInstanceUid = studyData.studyInstanceUid;
            Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
                sortStudy(study);
                // TODO:
                Session.set('studies', [study]);
                // TODO: Change thumbnails only
            });
        });


    }
});
