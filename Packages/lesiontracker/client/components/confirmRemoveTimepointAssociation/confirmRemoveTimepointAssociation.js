Template.confirmRemoveTimepointAssociation.events({
    'click #removeTimepointAssociations': function() {
        // Remove association
        Worklist.functions['removeTimepointAssociations']();
    }
});
