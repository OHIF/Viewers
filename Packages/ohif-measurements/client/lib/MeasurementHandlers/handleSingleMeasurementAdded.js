import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';
import getImageAttributes from './getImageAttributes';

export default function ({ instance, eventData, tool }) {
    const { measurementApi } = instance.data;
    const { measurementData, toolType } = eventData;

    const Collection = measurementApi.tools[toolType];

    // Stop here if the tool data shall not be persisted (e.g. temp tools)
    if (!Collection) return;

    // Stop here if there's no measurement data or if it was cancelled
    if (!measurementData || measurementData.cancelled) return;

    OHIF.log.info('CornerstoneToolsMeasurementAdded');

    const imageAttributes = getImageAttributes(eventData.element);
    const measurement = _.extend({}, measurementData, imageAttributes, {
        measurementNumber: measurementData.measurementNumber,
        userId: Meteor.userId()
    });

    // Get the related timepoint by the measurement number and use its location if defined
    const relatedTimepoint = Collection.findOne({
        measurementNumber: measurement.measurementNumber,
        toolType: measurementData.toolType,
        patientId: imageAttributes.patientId,
    });

    // Use the related timepoint location if found and defined
    if (relatedTimepoint && relatedTimepoint.location) {
        measurement.location = relatedTimepoint.location;
    }

    // Use the related timepoint description if found and defined
    if (relatedTimepoint && relatedTimepoint.description) {
        measurement.description = relatedTimepoint.description;
    }

    // Clean the measurement according to the Schema
    Collection._c2._simpleSchema.clean(measurement);

    // Insert the new measurement into the collection
    measurementData._id = Collection.insert(measurement);

    // Get the updated measurement number after inserting
    Meteor.defer(() => {
        measurementData.measurementNumber = Collection.findOne(measurementData._id).measurementNumber;
        cornerstone.updateImage(OHIF.viewerbase.viewportUtils.getActiveViewportElement());
    });

    // Notify that viewer suffered changes
    if (tool.toolGroup !== 'temp') {
        OHIF.measurements.triggerTimepointUnsavedChanges(eventData.toolType);
    }
}
