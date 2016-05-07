Template.studyBrowser.helpers({
    studies : function() {
        return ViewerStudies.find({selected: true});
    },
    thumbnails: function() {
        var study = this;
        var stacks = createStacks(study);

        var array = [];
        stacks.forEach(function(stack, index) {
            array.push({
                thumbnailIndex: index,
                stack: stack
            });
        });
        return array;
    }
});