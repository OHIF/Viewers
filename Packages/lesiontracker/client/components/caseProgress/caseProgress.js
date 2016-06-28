Template.caseProgress.onCreated(function caseProgressOnCreated() {
    const instance = Template.instance();

    instance.progressPercent = new ReactiveVar();
    instance.progressText = new ReactiveVar();
    instance.isLocked = new ReactiveVar();
    
    if (!instance.data.currentTimepointId) {
        console.warn('Case has no timepointId');
        return;
    }

    const currentTimepointId = instance.data.currentTimepointId;
    const timepoint = Timepoints.findOne({
        timepointId: currentTimepointId
    });

    const timepointType = timepoint.timepointType;

    instance.isLocked.set(timepoint.isLocked);

    if (timepointType === 'baseline') {
        instance.progressPercent.set(100);
    } else {
        // Retrieve the initial number of targets left to measure at this
        // follow-up. Note that this is done outside of the reactive function
        // below so that new lesions don't change the initial target count.
        const totalTargets = Measurements.find({
            isTarget: true
        }).count();

        // Setup a reactive function to update the progress whenever
        // a measurement is made
        instance.autorun(() => {
            // Obtain the number of Measurements for which the current Timepoint has
            // no Measurement data
            let numRemainingMeasurements = 0;
            Measurements.find().forEach(measurement => {
                if (!measurement.timepoints[currentTimepointId]) {
                    numRemainingMeasurements++;
                }
            });

            // Update the Case Progress text with the remaining measurement count
            instance.progressText.set(numRemainingMeasurements);

            // Calculate the Case Progress as a percentage in order to update the
            // radial progress bar
            const numMeasurementsMade = Math.max(totalTargets - numRemainingMeasurements, 0);
            const progressPercent = Math.round(100 * numMeasurementsMade / totalTargets);
            instance.progressPercent.set(progressPercent);
        });
    }
});

Template.caseProgress.helpers({
    progressPercent() {
        return Template.instance().progressPercent.get();
    },

    progressText() {
        return Template.instance().progressText.get();
    },

    isLocked() {
        return Template.instance().isLocked.get();
    },

    progressComplete() {
        let progressPercent = Template.instance().progressPercent.get();
        return progressPercent === 100;
    }
});

Template.caseProgress.events({
    'click .js-finish-case'() {
        console.log('Case Finished!');
        switchToTab('worklistTab');
    }
});
