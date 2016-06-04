Template.studyTimepointStudy.onRendered(() => {
    const instance = Template.instance();
    const $study = instance.$('.studyTimepointStudy');
    const $thumbnails = instance.$('.studyTimepointThumbnails');
    $study.addClass('active');
    $thumbnails.css('max-height', $thumbnails.height());
    $study.removeClass('active');
});

Template.studyTimepointStudy.helpers({
    thumbnails: function(study) {
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
