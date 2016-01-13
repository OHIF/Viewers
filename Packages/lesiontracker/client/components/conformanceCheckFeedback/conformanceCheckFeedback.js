Template.conformanceCheckFeedback.helpers({
    validationErrors: function() {
        // Return validation errors sorted by last added Target
        return ValidationErrors.find({}, {
            sort: {
                prefix: -1,
                type: 1
            }
        });
    }
});