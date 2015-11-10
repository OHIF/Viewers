Studies = new Mongo.Collection(null);

Template.worklistResult.helpers({
    studies : function() {
        return Studies.find({}, {sort: {patientName : 1, studyDate : 1}});
    }
});
