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
    // Changes the current study selection for the clicked study
    'click .studyModality'(event, instance) {
        const $study = $(event.currentTarget).closest('.studyTimepointStudy');
        const $timepoint = $study.closest('.studyTimepoint');
        const study = $study[0];

        const studyInstanceUid = this.study.studyInstanceUid;
        const selectionChanged = {
            selection: [study],
            studyInstanceUid: studyInstanceUid
        };

        // Check if the study already has series data,
        // and if not, retrieve it.
        if (!this.study.seriesList) {
            var alreadyLoaded = ViewerStudies.findOne({
                studyInstanceUid: studyInstanceUid
            });

            if (!alreadyLoaded) {
                study.classList.add('loading');
                getStudyMetadata(studyInstanceUid, (studyData) => {
                    ViewerStudies.insert(studyData);
                    $timepoint.trigger('selectionChanged', selectionChanged);
                });
            } else {
                this.study.seriesList = alreadyLoaded.seriesList;
            }
        } else {
            $timepoint.trigger('selectionChanged', selectionChanged);
        }
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
