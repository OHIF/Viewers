// Define the Studies Collection
// This is a client-side only Collection which
// Stores the list of studies in the Worklist
Studies = new Mongo.Collection(null);

Template.worklistResult.helpers({
    /**
     * Returns a sorted instance of the Studies Collection
     * by Patient name and Study Date in Ascending order.
     */
    studies : function() {
        return Studies.find({}, {sort: {patientName : 1, studyDate : 1}});
    }
});
