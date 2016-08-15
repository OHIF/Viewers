import { MeasurementsConfiguration } from 'meteor/ohif:measurements/both/configuration/measurements';

const config = MeasurementsConfiguration.getConfiguration();

Template.caseProgress.onCreated(() => {
    const instance = Template.instance();

    instance.progressPercent = new ReactiveVar();
    instance.progressText = new ReactiveVar();
    instance.isLocked = new ReactiveVar();
});

Template.caseProgress.onRendered(() => {
    const instance = Template.instance();

    // Stop here if we have no current timepoint ID (and therefore no defined timepointAPI)
    if (!instance.data.timepointApi) {
        instance.progressPercent.set(100);
        return;
    }

    // Get the current timepoint
    const current = instance.data.timepointApi.current();
    if (!current) {
        instance.progressPercent.set(100);
        return;
    }

    if (!current.timepointId) {
        instance.progressPercent.set(100);
        return;
    }

    instance.isLocked.set(current.isLocked);

    // Retrieve the initial number of targets left to measure at this
    // follow-up. Note that this is done outside of the reactive function
    // below so that new lesions don't change the initial target count.
    const withPriors = true;
    const totalTargets = 10; //instance.data.measurementApi.targets(withPriors).length;

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
            const numRemainingMeasurements = 5; //instance.data.measurementApi.unmarked().length;

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
        const instance = Template.instance();
        if (!instance.data.timepointApi) {
            return true;
        }

        const progressPercent = instance.progressPercent.get();
        return progressPercent === 100;
    }
});

Template.caseProgress.events({
    'click .js-finish-case'() {
        const instance = Template.instance();
        console.log('Case Finished!');
        switchToTab('studylistTab');
        instance.data.measurementApi.storeMeasurements();
    }
});
