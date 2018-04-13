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
    }
});
