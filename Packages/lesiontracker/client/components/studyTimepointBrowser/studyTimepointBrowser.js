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
    timepoints: function() {
        const sort = {
            sort: {
                earliestDate: -1
            }
        };
        return Timepoints.find({}, sort);
    },
    shouldShowTimepoint(timepoint, index) {
        const instance = Template.instance();
        if (instance.data.timepointViewType.get() === 'all') {
            return true;
        }

        return index < 4 || timepoint.timepointType === 'baseline';
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
