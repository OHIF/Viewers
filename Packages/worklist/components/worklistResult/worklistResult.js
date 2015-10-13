Studies = new Mongo.Collection(null);

Template.worklistResult.helpers({
    studies : function() {
        return Studies.find();
    }
});