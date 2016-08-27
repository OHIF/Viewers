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

Template.studyTimepointStudy.helpers({
    modalities() {
        const instance = Template.instance();
        let modalities = instance.data.study.modalities;

        // Replace backslashes with spaces
        return modalities.replace(/\\/g, ' ');
    },

    modalityStyle() {
        // Responsively styles the Modality Acronyms for studies
        // with more than one modality
        const instance = Template.instance();
        const modalities = instance.data.study.modalities;
        const numModalities = modalities.split(/\\/g).length;

        if (numModalities === 1) {
            // If we have only one modality, it should take up the whole
            // div.
            return 'font-size: 1vw';
        } else if (numModalities === 2) {
            // If we have two, let them sit side-by-side
            return 'font-size: 0.75vw';
        } else {
            // If we have more than two modalities, change the line
            // height to display multiple rows, depending on the number
            // of modalities we need to display.
            const lineHeight = Math.ceil(numModalities / 2) * 1.2;
            return 'line-height: ' + lineHeight + 'vh';
        }
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
                getStudyMetadata(studyInstanceUid, study => {
                    study.displaySets = createStacks(study);
                    ViewerStudies.insert(study);
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
