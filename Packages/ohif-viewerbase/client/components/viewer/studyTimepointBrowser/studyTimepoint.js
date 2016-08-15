Template.studyTimepoint.onCreated(() => {
    const instance = Template.instance();

    instance.isActive = {};
});

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

        // Defines where will be the studies searched
        let $studiesTarget = instance.$('.studyTimepoint');

        if (changed.isQuickSwitch) {
            // Changes the current quick switch study
            const study = ViewerStudies.findOne({
                studyInstanceUid: changed.studyInstanceUid
            });
            instance.data.currentStudy.set(study);

            // Changes the target to toggle the selection in all the studies
            $studiesTarget = $studiesTarget.closest('.studyTimepointBrowser');
        }

        // Removes selected state from all studies but the triggered study
        $studiesTarget.find('.studyTimepointStudy').not($selection).removeClass('active');

        if (changed.isQuickSwitch) {
            // Reset active studies map to allow only one active study
            instance.isActive = {};
            // Add selected state for the triggered study
            $selection.addClass('active');
        } else {
            const $timepoint = instance.$('.studyTimepoint');
            // Set the max-height to inherit to be able to expand the wrapper on its full height
            instance.$('.studyTimepointWrapper').css('max-height', 'inherit');
            // Toggle selected state for the triggered study
            $selection.removeClass('loading');
            $selection.toggleClass('active');
            // Recalculates the timepoint height to make CSS transition smoother
            const $thumbnails = $selection.find('.studyTimepointThumbnails');
            $thumbnails.one('transitionend', () => $timepoint.trigger('displayStateChanged'));
        }

        // Set the current study as active
        instance.isActive[changed.studyInstanceUid] = $selection.hasClass('active');
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
        const instance = Template.instance();

        if (!study.studyInstanceUid) {
            return;
        }

        return instance.isActive[study.studyInstanceUid];
    }
});
