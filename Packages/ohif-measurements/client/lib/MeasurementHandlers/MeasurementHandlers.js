import { OHIF } from 'meteor/ohif:core';
import handleSingleMeasurementAdded from './handleSingleMeasurementAdded';
import handleChildMeasurementAdded from './handleChildMeasurementAdded';
import handleSingleMeasurementModified from './handleSingleMeasurementModified';
import handleChildMeasurementModified from './handleChildMeasurementModified';
import handleSingleMeasurementRemoved from './handleSingleMeasurementRemoved';
import handleChildMeasurementRemoved from './handleChildMeasurementRemoved';

const MeasurementHandlers = {
    handleSingleMeasurementAdded,
    handleChildMeasurementAdded,
    handleSingleMeasurementModified,
    handleChildMeasurementModified,
    handleSingleMeasurementRemoved,
    handleChildMeasurementRemoved,

    onAdded(event, instance) {
        const eventData = event.detail;
        const { toolType } = eventData;
        const { toolGroupId, toolGroup, tool } = OHIF.measurements.getToolConfiguration(toolType);
        const params = {
            instance,
            eventData,
            tool,
            toolGroupId,
            toolGroup
        };

        if (!tool) return;

        if (tool.parentTool) {
            this.handleChildMeasurementAdded(params);
        } else {
            this.handleSingleMeasurementAdded(params);
        }
    },

    onModified(event, instance) {
        const eventData = event.detail;
        const { toolType } = eventData;
        const { toolGroupId, toolGroup, tool } = OHIF.measurements.getToolConfiguration(toolType);
        const params = {
            instance,
            eventData,
            tool,
            toolGroupId,
            toolGroup
        };

        if (!tool) return;

        if (tool.parentTool) {
            this.handleChildMeasurementModified(params);
        } else {
            this.handleSingleMeasurementModified(params);
        }
    },

    onRemoved(event, instance) {
        const eventData = event.detail;
        const { toolType } = eventData;
        const { toolGroupId, toolGroup, tool } = OHIF.measurements.getToolConfiguration(toolType);
        const params = {
            instance,
            eventData,
            tool,
            toolGroupId,
            toolGroup
        };

        if (!tool) return;

        if (tool.parentTool) {
            MeasurementHandlers.handleChildMeasurementRemoved(params);
        } else {
            MeasurementHandlers.handleSingleMeasurementRemoved(params);
        }
    }
};

OHIF.measurements.MeasurementHandlers = MeasurementHandlers;
