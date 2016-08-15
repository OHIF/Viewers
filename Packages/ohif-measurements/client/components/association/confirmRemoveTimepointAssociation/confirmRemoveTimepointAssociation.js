Template.confirmRemoveTimepointAssociation.events({
    'click #removeTimepointAssociations': function() {
        // Remove association
        StudyList.functions['removeTimepointAssociations']();
    }
});
