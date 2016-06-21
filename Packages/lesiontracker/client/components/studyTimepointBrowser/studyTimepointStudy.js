Template.studyTimepointStudy.onCreated(() => {
    const instance = Template.instance();

    // Set the current study as selected in the studies list
    instance.select = (isQuickSwitch=false) => {
        const $study = instance.$('.studyTimepointStudy');
        const $timepoint = $study.closest('.studyTimepoint');

        const selectionChanged = {
            selection: [$study[0]],
            studyInstanceUid: instance.data.study.studyInstanceUid,
            isQuickSwitch
        };

        $timepoint.trigger('selectionChanged', selectionChanged);
    };
});

// Initialize the study wrapper max-height to enable CSS transition
Template.studyTimepointStudy.onRendered(() => {
    const instance = Template.instance();
    const $study = instance.$('.studyTimepointStudy');
    const $thumbnails = instance.$('.studyTimepointThumbnails');
    $study.addClass('active');
    $thumbnails.css('max-height', $thumbnails.height());
    $study.removeClass('active');

    // Here we add, remove, and add the active class again because this way
    // the max-height animation appears smooth to the user.
    if (instance.data.active) {
        Meteor.setTimeout(() => {
            $study.addClass('active');
        }, 1);
    }
});

Template.studyTimepointStudy.events({
    // Recalculates the timepoint height to make CSS transition smoother
    'transitionend .studyTimepointThumbnails'(event, instance) {
        if (event.target === event.currentTarget) {
            $(event.currentTarget).closest('.studyTimepoint').trigger('displayStateChanged');
        }
    },

    // Transfers the active state to the current study
    'click .studyQuickSwitchTimepoint .studyModality'(event, instance) {
        instance.select(true);
    },

    // Changes the current study selection for the clicked study
    'click .studyModality'(event, instance) {
        const $study = $(event.currentTarget).closest('.studyTimepointStudy');

        const studyData = instance.data.study;
        const studyInstanceUid = studyData.studyInstanceUid;

        const isQuickSwitch = !_.isUndefined(instance.data.viewportIndex);

        // Check if the study already has series data,
        // and if not, retrieve it.
        if (!studyData.seriesList) {
            const alreadyLoaded = ViewerStudies.findOne({
                studyInstanceUid
            });

            if (!alreadyLoaded) {
                $study.addClass('loading');
                getStudyMetadata(studyInstanceUid, studyData => {
                    ViewerStudies.insert(studyData);
                    instance.select(isQuickSwitch);
                });
            } else {
                studyData.seriesList = alreadyLoaded.seriesList;
            }
        } else {
            instance.select(isQuickSwitch);
        }
    }
});
