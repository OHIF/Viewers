Template.studyTimepointBrowser.onCreated(() => {
    const instance = Template.instance();

    // Reactive variable to control the view type for all or key timepoints
    instance.timepointViewType = new ReactiveVar(instance.data.timepointViewType);

    // Defines whether to show all key timepoints or only the current one
    instance.showAdditionalTimepoints = new ReactiveVar(true);

    // Return the current study if it's defined
    instance.getCurrentStudy = () => {
        return instance.data.currentStudy && instance.data.currentStudy.get();
    };

    // Get the studies for a specific timepoint
    instance.getStudies = timepoint => {
        if (!timepoint) {
            return ViewerStudies.find().fetch();
        }

        return timepoint.studyInstanceUids.map(studyInstanceUid => {
            const query = {
                patientId: timepoint.patientId,
                timepointId: timepoint.timepointId,
                studyInstanceUid: studyInstanceUid
            };

            var loadedStudy = ViewerStudies.findOne(query);
            if (loadedStudy) {
                return loadedStudy;
            }

            var notYetLoaded = Studies.findOne(query);
            if (!notYetLoaded) {
                throw 'No study data available for Study: ' + studyInstanceUid;
            }

            return notYetLoaded;
        });
    };
});

Template.studyTimepointBrowser.onRendered(() => {
    const instance = Template.instance();

    instance.autorun(() => {
        // Runs this computation everytime the timepointViewType is changed
        const type = instance.timepointViewType.get();

        // Removes all active classes to collapse the timepoints and studies
        instance.$('.timepointEntry, .studyTimepointStudy').removeClass('active');
        if (type === 'key') {
            // Show only first timepoint expanded for key timepoints
            instance.$('.timepointEntry:first').addClass('active');
        }
    });

    let lastStudy;
    instance.autorun(() => {
        // Runs this computation everytime the curenty study is changed
        const currentStudy = instance.data.currentStudy && instance.data.currentStudy.get();

        // Check if the study really changed and update the last study
        if (currentStudy !== lastStudy) {
            instance.showAdditionalTimepoints.set(false);
            lastStudy = currentStudy;
        }
    });
});

Template.studyTimepointBrowser.events({
    'click .timepointHeader'(event, instance) {
        const $timepoint = $(event.currentTarget).closest('.timepointEntry');

        // Recalculates the timepoint height to make CSS transition smoother
        $timepoint.find('.studyTimepoint').trigger('displayStateChanged');

        // Toggle active class to group/ungroup timepoint studies
        $timepoint.toggleClass('active');
    },

    'click .studyModality.additional'(event, instance) {
        // Show all key timepoints
        instance.showAdditionalTimepoints.set(true);
    }
});

Template.studyTimepointBrowser.helpers({
    // Decides if the timepoint view type switch shall be shown or omitted
    shallShowViewType(timepointList) {
        const instance = Template.instance();
        return timepointList.length && !instance.data.timepointViewType;
    },

    // Returns the button group data for switching between timepoint view types
    viewTypeButtonGroupData() {
        return {
            value: Template.instance().timepointViewType,
            options: [{
                value: 'key',
                text: 'Key Timepoints'
            }, {
                value: 'all',
                text: 'All Timepoints'
            }]
        };
    },

    // Defines whether to show all key timepoints or only the current one
    showAdditionalTimepoints() {
        return Template.instance().showAdditionalTimepoints.get();
    },

    // Get the timepoints to be listed
    timepoints() {
        const instance = Template.instance();
        // Get the current study
        const currentStudy = instance.getCurrentStudy();
        // Build the query
        const query = {};
        if (currentStudy && !instance.showAdditionalTimepoints.get()) {
            query['studyInstanceUids'] = {
                $in: [currentStudy.studyInstanceUid]
            };
        }
        // Sort timepoints based on timeline and type
        const sort = {
            sort: {
                latestDate: 1
            }
        };
        // Returns all timepoints with sorting
        return Timepoints.find(query, sort).fetch().reverse();
    },

    // Get the studies for a specific timepoint
    studies(timepoint) {
        return Template.instance().getStudies(timepoint);
    },

    // Decides if a timepoint shall be shown or omitted
    shallShowTimepoint(timepoint, index) {
        const instance = Template.instance();

        // Show all timepoints when view type is all
        if (instance.timepointViewType.get() === 'all') {
            return true;
        }

        // Always Show the timepoint for current study
        const currentStudy = instance.getCurrentStudy();
        if (currentStudy && _.contains(timepoint.studyInstanceUids, currentStudy.studyInstanceUid)) {
            return true;
        }

        // Show only the latest timepoints and baseline
        return index < 3 || timepoint.timepointType === 'baseline';
    },

    // Build the timepoint title based on its date
    timepointTitle(timepoint, total, index) {
        const timepointName = getTimepointName(timepoint);

        const states = {
            0: '(Current)',
            1: '(Prior)'
        };
        // TODO: [design] find out how to define the nadir timepoint
        const parenthesis = states[index] || '';
        return `${timepointName} ${parenthesis}`;
    },

    // Build the modalities summary for all timepoint's studies
    modalitiesSummary(timepoint) {
        const instance = Template.instance();

        const studies = instance.getStudies(timepoint);

        const modalities = {};
        studies.forEach(study => {
            const modality = study.modalities || 'UN';
            modalities[modality] = modalities[modality] + 1 || 1;
        });

        const result = [];
        _.each(modalities, (count, modality) => {
            result.push(`${count} ${modality}`);
        });

        return result.join(', ');
    }
});
