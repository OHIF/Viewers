Template.thumbnails.helpers({
    thumbnails: function() {
        var stacks = createStacks(this.study);
        var studyIndex = this.studyIndex;
        
        var array = [];
        stacks.forEach(function(stack, index) {
            array.push({
                thumbnailIndex: index * (studyIndex + 1),
                stack: stack
            });
        });
        return array;
    }
});