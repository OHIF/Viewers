import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';
import { Viewerbase } from 'meteor/ohif:viewerbase';

Template.measurementTableHeaderRow.helpers({
    numberOfMeasurements() {
        const { measurementRows } = Template.instance().data;
        return measurementRows.length ? measurementRows.length : null;
    },

    maxNumMeasurements() {
        const { conformanceCriteria } = Template.instance().data;
        if (!conformanceCriteria) return;

        return conformanceCriteria.maxTargets.get();
    },

    anyUnmarkedLesionsLeft() {
        // Skip New Lesions section
        const instance = Template.instance();
        const { toolGroup, measurementRows, timepointApi, measurementApi } = instance.data;
        if (!measurementRows) {
            return;
        }

        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        if (toolGroup.id === config.newMeasurementTool.id) {
            return;
        }

        const current = timepointApi.current();
        const prior = timepointApi.prior();
        if (!prior) {
            return true;
        }

        const currentFilter = { timepointId: current.timepointId };
        const priorFilter = { timepointId: prior.timepointId };
        const toolGroupId = toolGroup.id;

        const numCurrent = measurementApi.fetch(toolGroupId, currentFilter).length;
        const numPrior = measurementApi.fetch(toolGroupId, priorFilter).length;
        const remaining = Math.max(numPrior - numCurrent, 0);
        return remaining > 0;
    }
});

Template.measurementTableHeaderRow.events({
    'click .js-setTool'(event, instance) {
        const { toolGroup } = instance.data;
        Viewerbase.toolManager.setActiveTool(toolGroup.childTools[0].cornerstoneToolType);
    }
});
