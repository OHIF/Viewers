import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

class MeasurementHandlers {

    static onAdded(e, instance, eventData) {
        const measurementData = eventData.measurementData;
        const measurementApi = instance.data.measurementApi;
        const Collection = measurementApi.tools[eventData.toolType];

        // Stop here if collection was not found for the given tool
        if (!Collection) {
            return;
        }

        // Get the Cornerstone imageId
        const enabledElement = cornerstone.getEnabledElement(eventData.element);
        const imageId = enabledElement.image.imageId;

        // Get studyInstanceUid & patientId
        const study = cornerstoneTools.metaData.get('study', imageId);
        const studyInstanceUid = study.studyInstanceUid;
        const patientId = study.patientId;

        // Get seriesInstanceUid
        const series = cornerstoneTools.metaData.get('series', imageId);
        const seriesInstanceUid = series.seriesInstanceUid;

        // Get sopInstanceUid
        const sopInstance = cornerstoneTools.metaData.get('instance', imageId);
        const sopInstanceUid = sopInstance.sopInstanceUid;
        const frameIndex = sopInstance.frame || 0;

        OHIF.log.info('CornerstoneToolsMeasurementAdded');

        let measurement = $.extend({
            userId: Meteor.userId(),
            patientId: patientId,
            studyInstanceUid: studyInstanceUid,
            seriesInstanceUid: seriesInstanceUid,
            sopInstanceUid: sopInstanceUid,
            frameIndex: frameIndex,
            imageId: imageId // TODO: In the future we should consider removing this
        }, measurementData);

        const timepointApi = instance.data.timepointApi;
        if (timepointApi) {
            const timepoint = timepointApi.study(studyInstanceUid)[0];
            if (timepoint) {
                const timepointId = timepoint.timepointId;
                measurement.timepointId = timepointId;
                measurement.measurementNumber = OHIF.measurements.MeasurementManager.getNewMeasurementNumber(timepointId, Collection, timepointApi);
            }
        } else {
            const numCurrentMeasurementsInStudy = Collection.find({
                studyInstanceUid: study.studyInstanceUid
            }).count();
            measurement.measurementNumber = numCurrentMeasurementsInStudy + 1;
        }

        // Get the related timepoint by the measurement number and use its location if defined
        const relatedTimepoint = Collection.findOne({
            measurementNumber: measurement.measurementNumber,
            toolType: measurementData.toolType,
            patientId,
        });

        // Use the related timepoint location if found and defined
        if (relatedTimepoint && relatedTimepoint.location) {
            measurement.location = relatedTimepoint.location;
        }

        // Clean the measurement according to the Schema
        Collection._c2._simpleSchema.clean(measurement);

        // Insert the new measurement into the collection
        console.warn('>>>>INSERTING', measurement);
        measurementData._id = Collection.insert(measurement);
        console.warn('>>>>INSERTED', measurementData);

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);

        // Update the Overall Measurement Numbers for all Measurements
        if (timepointApi) {
            const baseline = timepointApi.baseline();

            // TODO: Fix this it is a terrible workaround but we have a demo to do
            if (baseline) {
                measurementApi.sortMeasurements(baseline.timepointId);
            }
        }
    }

    static onModified(e, instance, eventData) {
        const measurementData = eventData.measurementData;
        const measurementApi = instance.data.measurementApi;
        const Collection = measurementApi.tools[eventData.toolType];

        OHIF.log.info('CornerstoneToolsMeasurementModified');

        let measurement = Collection.findOne(measurementData._id);

        Object.keys(measurementData).forEach(key => {
            measurement[key] = measurementData[key];
        });

        const measurementId = measurement._id;
        delete measurement._id;

        // If the measurement configuration includes a value for Viewport,
        // we will populate this with the Cornerstone Viewport
        if (Collection._c2._simpleSchema.schema('viewport')) {
            measurement.viewport = cornerstone.getViewport(eventData.element);
        }

        // Clean the measurement according to the Schema
        Collection._c2._simpleSchema.clean(measurement);

        // Insert the new measurement into the collection
        Collection.update(measurementId, {
            $set: measurement
        });

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);
    }

    static onRemoved(e, instance, eventData) {
        OHIF.log.info('CornerstoneToolsMeasurementRemoved');
        const measurementData = eventData.measurementData;
        const measurementApi = instance.data.measurementApi;
        const Collection = measurementApi.tools[eventData.toolType];

        // Remove the measurement from the collection
        Collection.remove(measurementData._id);

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);

        // Update the Overall Measurement Numbers for all Measurements
        const timepointApi = instance.data.timepointApi;
        if (timepointApi) {
            const baseline = timepointApi.baseline();

            // TODO: Fix this it is a terrible workaround but we have a demo to do
            if (baseline) {
                measurementApi.sortMeasurements(baseline.timepointId);
            }
        }
    }
}

OHIF.measurements.MeasurementHandlers = MeasurementHandlers;
