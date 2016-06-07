// Initialize the study wrapper max-height to enable CSS transition
Template.studyTimepointStudy.onRendered(() => {
    const instance = Template.instance();
    const $study = instance.$('.studyTimepointStudy');
    const $thumbnails = instance.$('.studyTimepointThumbnails');
    $study.addClass('active');
    $thumbnails.css('max-height', $thumbnails.height());
    $study.removeClass('active');
});

Template.studyTimepointStudy.events({
    // Recalculates the timepoint height to make CSS transition smoother
    'transitionend .studyTimepointThumbnails'(event, instance) {
        if (event.target === event.currentTarget) {
            $(event.currentTarget).closest('.studyTimepoint').trigger('displayStateChanged');
        }
    },
    // Changes the current study selection for the clicked study
    'click .studyModality'(event, instance) {
        const $study = $(event.currentTarget).closest('.studyTimepointStudy');
        const $timepoint = $study.closest('.studyTimepoint');
        const study = $study[0];
        $timepoint.trigger('selectionChanged', [study]);
    }
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
