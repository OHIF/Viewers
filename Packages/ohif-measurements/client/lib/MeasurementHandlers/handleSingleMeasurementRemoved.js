import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

export default function({ instance, eventData, tool, toolGroupId, toolGroup }) {
    OHIF.log.info('CornerstoneToolsMeasurementRemoved');
    const measurementData = eventData.measurementData;
    const { measurementApi, timepointApi } = instance.data;
    const Collection = measurementApi.tools[eventData.toolType];

    // Stop here if the tool data shall not be persisted (e.g. temp tools)
    if (!Collection) return;

    const measurementTypeId = measurementApi.toolsGroupsMap[eventData.toolType];
    const measurement = Collection.findOne(measurementData._id);

    // Stop here if the measurement is already gone or never existed
    if (!measurement) return;

    // Remove all the measurements with the given type and number
    const { measurementNumber, timepointId } = measurement;
    measurementApi.deleteMeasurements(measurementTypeId, {
        measurementNumber,
        timepointId
    });

    // Sync the new measurement data with cornerstone tools
    const baseline = timepointApi.baseline();
    measurementApi.sortMeasurements(baseline.timepointId);

    // Repaint the images on all viewports without the removed measurements
    _.each($('.imageViewerViewport:not(.empty)'), element => cornerstone.updateImage(element));

    // Notify that viewer suffered changes
    if (tool.toolGroup !== 'temp') {
        OHIF.measurements.triggerTimepointUnsavedChanges(eventData.toolType);
    }
}
