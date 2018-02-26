import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

export default function ({ instance, eventData, tool, toolGroupId, toolGroup }) {
    const { measurementApi } = instance.data;
    const { measurementData, toolType } = eventData;

    const Collection = measurementApi.tools[toolType];

    // Stop here if the tool data shall not be persisted (e.g. temp tools)
    if (!Collection) return;

    OHIF.log.info('CornerstoneToolsMeasurementModified');

    const measurement = Collection.findOne(measurementData._id);

    // Stop here if the measurement is already deleted
    if (!measurement) return;

    // Update the collection data with the cornerstone measurement data
    const ignoredKeys = ['location', 'description', 'response'];
    Object.keys(measurementData).forEach(key => {
        if (_.contains(ignoredKeys, key)) return;
        measurement[key] = measurementData[key];
    });

    const measurementId = measurement._id;
    delete measurement._id;

    // If the measurement configuration includes a value for Viewport,
    // we will populate this with the Cornerstone Viewport
    if (Collection._c2._simpleSchema.schema('viewport')) {
        measurement.viewport = cornerstone.getViewport(eventData.element);
    }

    // Update the measurement in the collection
    Collection.update(measurementId, { $set: measurement });

    // Notify that viewer suffered changes
    if (tool.toolGroup !== 'temp') {
        OHIF.measurements.triggerTimepointUnsavedChanges(eventData.toolType);
    }
}
