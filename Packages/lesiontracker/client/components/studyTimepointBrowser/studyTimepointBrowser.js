Template.studyTimepointBrowser.onRendered(() => {
    const instance = Template.instance();
    instance.autorun(() => {
        // Runs this computation everytime the timepointViewType is changed
        const type = instance.data.timepointViewType.get();

        // Removes all active classes to collapse the timepoints and studies
        instance.$('.timepointEntry, .studyTimepointStudy').removeClass('active');
        if (type === 'key') {
            // Show only first timepoint expanded for key timepoints
            instance.$('.timepointEntry:first').addClass('active');
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
    }
});

Template.studyTimepointBrowser.helpers({
    timepoints() {
        // Sort timepoints based on timeline and type
        const sort = {
            sort: {
                earliestDate: -1,
                timepointType: -1
            }
        };
        // Returns all timepoints with sorting
        return Timepoints.find({}, sort);
    },
    // Decides if a timepoint should be shown or omitted
    shouldShowTimepoint(timepoint, index) {
        const instance = Template.instance();

        // Show all timepoints when view type is all
        if (instance.data.timepointViewType.get() === 'all') {
            return true;
        }

        // Show only the latest timepoints and baseline
        return index < 3 || timepoint.timepointType === 'baseline';
    },
    // Build the timepoint title based on its date
    timepointTitle(timepoint, total, index) {
        if (timepoint.timepointType === 'baseline') {
            return 'Baseline';
        }

        const states = {
            0: '(Current)',
            1: '(Prior)',
            2: '(Nadir)'
        };
        // TODO: [design] find out how to define the nadir timepoint
        const followUp = total - index - 1;
        const parenthesis = states[index] || '';
        return `Follow-up ${followUp} ${parenthesis}`;
    }
});
