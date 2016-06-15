var isActive = {};

// Initialize the timepoint wrapper max-height to enable CSS transition
Template.studyTimepoint.onRendered(() => {
    const instance = Template.instance();

    const $studies = instance.$('.studyTimepoint');
    const $wrapper = $studies.closest('.studyTimepointWrapper');
    const $timepoint = $wrapper.closest('.timepointEntry');
    const studiesVisible = $studies.is(':visible');

    if (!studiesVisible) {
        $timepoint.addClass('active');
    }

    // Recalculates the timepoint height to make CSS transition smoother
    $studies.trigger('displayStateChanged');

    if (!studiesVisible) {
        $timepoint.removeClass('active');
    }
});

Template.studyTimepoint.events({
    // Changes the selected study
    'selectionChanged .studyTimepoint'(event, instance, changed) {
        const $selection = $(changed.selection);
        const $thumbnails = $selection.find('.studyTimepointThumbnails');
        const $timepoint = instance.$('.studyTimepoint');
        const studyInstanceUid = changed.studyInstanceUid;

        // Set the max-height to inherit to be able to expand the wrapper on its full height
        instance.$('.studyTimepointWrapper').css('max-height', 'inherit');

        // Removes selected state from all studies but the triggered study
        instance.$('.studyTimepointStudy').not($selection).removeClass('active');

        // Toggle selected state for the triggered study
        $selection.removeClass('loading');
        $selection.toggleClass('active');
        isActive[studyInstanceUid] = $selection.hasClass('active');

        // Recalculates the timepoint height to make CSS transition smoother
        $thumbnails.one('transitionend', () => $timepoint.trigger('displayStateChanged'));
    },
    // It should be triggered when the timepoint height is changed
    'displayStateChanged .studyTimepoint'(event, instance) {
        const $timepoint = $(event.currentTarget);
        const $wrapper = $timepoint.closest('.studyTimepointWrapper');

        // Set the max-height for the wrapper to make CSS transition smoother
        $wrapper.css('max-height', $timepoint.height());
    }
});

Template.studyTimepoint.helpers({
    isActive(study) {
        if (!study.studyInstanceUid) {
            return;
        }

        return isActive[study.studyInstanceUid];
    }
})
