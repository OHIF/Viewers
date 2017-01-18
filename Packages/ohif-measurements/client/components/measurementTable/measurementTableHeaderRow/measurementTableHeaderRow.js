import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.measurementTableHeaderRow.helpers({
    numberOfMeasurements() {
        const instance = Template.instance();
        if (!instance.data.measurements) {
            return;
        }

        return instance.data.measurements.length;
    },

    maxNumMeasurements() {
        const instance = Template.instance();
        if (!instance.data.conformanceCriteria) {
            return;
        }

        return instance.data.conformanceCriteria.maxTargets.get();
    },

    anyUnmarkedLesionsLeft() {
        // Skip New Lesions section
        const instance = Template.instance();
        if (!instance.data.measurements) {
            return;
        }

        const measurementType = instance.data.measurementType;
        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        if (measurementType.id === config.newMeasurementTool.id) {
            return;
        }

        const timepointApi = instance.data.timepointApi;
        const current = timepointApi.current();
        const prior = timepointApi.prior();
        if (!prior) {
            return true;
        }

        const currentFilter = { timepointId: current.timepointId };
        const priorFilter = { timepointId: prior.timepointId };
        const measurementTypeId = measurementType.id;

        const measurementApi = instance.data.measurementApi;
        const numCurrent = measurementApi.fetch(measurementTypeId, currentFilter).length;
        const numPrior = measurementApi.fetch(measurementTypeId, priorFilter).length;
        const remaining = Math.max(numPrior - numCurrent, 0);
        return remaining > 0;
    }
});

Template.measurementTableHeaderRow.events({
    'click .js-setTool'(event, instance) {
        const measurementType = instance.data.measurementType;
        toolManager.setActiveTool(measurementType.cornerstoneToolType);
    }
});
