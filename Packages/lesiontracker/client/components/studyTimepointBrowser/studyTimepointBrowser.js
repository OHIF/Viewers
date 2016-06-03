Template.studyTimepointBrowser.events({
    'click .studyTimepointStudy'(event, instance) {
        const element = event.currentTarget;
        instance.$('.studyTimepointStudy').not(element).removeClass('active');
        $(element).toggleClass('active');
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
    timepointTitle(timepoint, total, index) {
        if (timepoint.timepointType === 'baseline') {
            return 'Baseline';
        }

        const states = {
            0: '(current)',
            1: '(prior)',
            2: '(nadir)'
        };
        const followUp = total - index - 1;
        const parenthesis = states[index] || '';
        return `Follow-up ${followUp} ${parenthesis}`;
    }
});
