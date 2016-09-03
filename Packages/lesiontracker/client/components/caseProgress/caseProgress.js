import { MeasurementApi } from 'meteor/lesiontracker/client/api/measurement';

Template.caseProgress.onCreated(() => {
    const instance = Template.instance();

    instance.progressPercent = new ReactiveVar();
    instance.progressText = new ReactiveVar();
    instance.isLocked = new ReactiveVar();

    // Get the current timepoint
    const current = instance.data.timepointApi.current();

    // Stop here if no timepoint was found
    if (!current) {
        return;
    }

    if (!current.timepointId) {
        console.warn('Case has no timepointId');
        return;
    }

    instance.isLocked.set(current.isLocked);

    // Retrieve the initial number of targets left to measure at this
    // follow-up. Note that this is done outside of the reactive function
    // below so that new lesions don't change the initial target count.
    const withPriors = true;
    const totalTargets = MeasurementApi.targets(withPriors).length;

    // If we're currently reviewing a Baseline timepoint, don't do any
    // progress measurement.
    if (current.timepointType === 'baseline') {
        instance.progressPercent.set(100);
    } else {
        // Setup a reactive function to update the progress whenever
        // a measurement is made
        instance.autorun(() => {
            // Obtain the number of Measurements for which the current Timepoint has
            // no Measurement data
            const numRemainingMeasurements = MeasurementApi.unmarked().length;

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
        const progressPercent = Template.instance().progressPercent.get();
        return progressPercent === 100;
    }
});

Template.caseProgress.events({
    'click .js-finish-case'() {
        console.log('Case Finished!');
        switchToTab('worklistTab');
    }
});
