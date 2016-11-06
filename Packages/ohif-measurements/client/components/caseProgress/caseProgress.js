import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

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
    const prior = instance.data.timepointApi.prior();
    if (!current || !prior || !current.timepointId) {
        instance.progressPercent.set(100);
        return;
    }

    instance.isLocked.set(current.isLocked);

    // Retrieve the initial number of targets left to measure at this
    // follow-up. Note that this is done outside of the reactive function
    // below so that new lesions don't change the initial target count.

    const config = OHIF.measurements.MeasurementApi.getConfiguration();
    const tools = config.measurementTools;
    const toolsToInclude = tools.filter(tool => tool.options && tool.options.includeInCaseProgress);
    const toolIds = toolsToInclude.map(tool => tool.id);
    const api = instance.data.measurementApi;

    const getNumMeasurementsAtTimepoint = timepointId => {
        const filter = {
            timepointId: timepointId
        };

        let count = 0;
        toolIds.forEach(measurementTypeId => {
            count += api.fetch(measurementTypeId, filter).length;
        });

        return count;
    };

    const getNumRemainingBetweenTimepoints = (currentTimepointId, priorTimepointId) => {
        const currentFilter = {
            timepointId: currentTimepointId
        };

        const priorFilter = {
            timepointId: priorTimepointId
        };

        let totalRemaining = 0;
        toolIds.forEach(measurementTypeId => {
            const numCurrent = api.fetch(measurementTypeId, currentFilter).length;
            const numPrior = api.fetch(measurementTypeId, priorFilter).length;
            const remaining = Math.max(numPrior - numCurrent, 0);
            totalRemaining += remaining;
        });

        return totalRemaining;
    };

    const totalMeasurements = getNumMeasurementsAtTimepoint(prior.timepointId);

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
            const numRemainingMeasurements = getNumRemainingBetweenTimepoints(current.timepointId, prior.timepointId);
            const numMeasurementsMade = totalMeasurements - numRemainingMeasurements;

            // Update the Case Progress text with the remaining measurement count
            instance.progressText.set(numRemainingMeasurements);

            // Calculate the Case Progress as a percentage in order to update the
            // radial progress bar
            const progressPercent = Math.min(100, Math.round(100 * numMeasurementsMade / totalMeasurements));
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
        switchToTab('studylistTab');
        instance.data.measurementApi.storeMeasurements();
    }
});
