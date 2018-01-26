import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';
import { Viewerbase } from 'meteor/ohif:viewerbase';

Template.measurementTableHeaderRow.helpers({
    numberOfMeasurements(toolGroupId) {
        const { toolGroup, measurementRows } = Template.instance().data;
        if (toolGroup.id === 'newTargets') {
            let result = 0;

            measurementRows.forEach(measurementRow => {
                const measurementData = measurementRow.entries[0];
                if (measurementData.isSplitLesion) return;
                result++;
            });

            return result;
        }

        return measurementRows.length ? measurementRows.length : null;
    },

    getMax(toolGroupId) {
        const { conformanceCriteria } = Template.instance().data;
        if (!conformanceCriteria) return;

        if (toolGroupId === 'targets') {
            return conformanceCriteria.maxTargets.get();
        } else if (toolGroupId === 'newTargets') {
            return conformanceCriteria.maxNewTargets.get();
        }
    },

    anyUnmarkedLesionsLeft() {
        // Skip New Lesions section
        const instance = Template.instance();
        const { toolGroup, measurementRows, timepointApi, measurementApi } = instance.data;
        if (!measurementRows) return;

        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        if (config.newLesions && config.newLesions.find(o => o.id === toolGroup.id)) return;

        const current = timepointApi.current();
        const prior = timepointApi.prior();
        if (!prior) return true;

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
        const toolType = toolGroup.childTools[0].cornerstoneToolType;
        const activeToolId = Array.isArray(toolType) ? toolType[0] : toolType;
        Viewerbase.toolManager.setActiveTool(activeToolId);
    }
});
