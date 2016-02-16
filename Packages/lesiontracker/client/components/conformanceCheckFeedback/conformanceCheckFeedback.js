Template.conformanceCheckFeedback.helpers({
    validationErrors: function() {
        // Return validation errors sorted by last added Target
        var errors = ValidationErrors.find({}, {
            sort: {
                prefix: -1,
                type: 1
            }
        });

        Template.instance().validationErrors.set(errors.fetch());
        return errors;
    }
});

Template.conformanceCheckFeedback.events({
    'mouseenter #conformanceCheckFeedback': function(e, template) {
        if (template.validationErrors.get().length > 0) {
            $(e.currentTarget).addClass("conformanceHover");
        }
    },
    'mouseleave #conformanceCheckFeedback': function(e, template) {
        var conformanceDiv = e.currentTarget;
        if ($(conformanceDiv).hasClass("conformanceHover")) {
            $(conformanceDiv).removeClass("conformanceHover");
        }
    }
});

Template.conformanceCheckFeedback.onCreated(function() {
    this.validationErrors = new ReactiveVar([]);
});