import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { cornerstone } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';

const getImageAttributes = element => {
    // Get the Cornerstone imageId
    const enabledElement = cornerstone.getEnabledElement(element);
    const imageId = enabledElement.image.imageId;

    // Get studyInstanceUid & patientId
    const study = cornerstone.metaData.get('study', imageId);
    const studyInstanceUid = study.studyInstanceUid;
    const patientId = study.patientId;

    // Get seriesInstanceUid
    const series = cornerstone.metaData.get('series', imageId);
    const seriesInstanceUid = series.seriesInstanceUid;

    // Get sopInstanceUid
    const sopInstance = cornerstone.metaData.get('instance', imageId);
    const sopInstanceUid = sopInstance.sopInstanceUid;
    const frameIndex = sopInstance.frame || 0;

    const imagePath = [studyInstanceUid, seriesInstanceUid, sopInstanceUid, frameIndex].join('_');

    return {
        patientId,
        studyInstanceUid,
        seriesInstanceUid,
        sopInstanceUid,
        frameIndex,
        imagePath
    };
};

class MeasurementHandlers {

    static handleSingleMeasurementAdded({ instance, eventData, tool }) {
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

        // Clean the measurement according to the Schema
        Collection._c2._simpleSchema.clean(measurement);

        // Insert the new measurement into the collection
        measurementData._id = Collection.insert(measurement);

        // Get the updated measurement number after inserting
        Meteor.defer(() => {
            measurementData.measurementNumber = Collection.findOne(measurementData._id).measurementNumber;
            cornerstone.updateImage(OHIF.viewerbase.viewportUtils.getActiveViewportElement());
        });

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);
    }

    static handleChildMeasurementAdded({ instance, eventData, tool, toolGroupId, toolGroup }) {
        const { measurementApi } = instance.data;
        const { measurementData } = eventData;

        const Collection = measurementApi.tools[tool.parentTool];

        // Stop here if the tool data shall not be persisted (e.g. temp tools)
        if (!Collection) return;

        // Stop here if there's no measurement data or if it was cancelled
        if (!measurementData || measurementData.cancelled) return;

        OHIF.log.info('CornerstoneToolsMeasurementAdded');

        const imageAttributes = getImageAttributes(eventData.element);
        const measurement = {
            toolType: tool.parentTool,
            measurementNumber: measurementData.measurementNumber,
            userId: Meteor.userId(),
            patientId: imageAttributes.patientId,
            studyInstanceUid: imageAttributes.studyInstanceUid
        };

        const additionalProperties = _.extend(imageAttributes, {
            userId: Meteor.userId()
        });

        const childMeasurement = _.extend({}, measurementData, additionalProperties);

        const parentMeasurement = Collection.findOne({
            toolType: tool.parentTool,
            patientId: imageAttributes.patientId,
            [tool.attribute]: null
        });

        // Check if a measurement to fit this child tool already exists
        if (parentMeasurement) {
            const key = tool.attribute;

            // Add the createdAt attribute
            childMeasurement.createdAt = new Date();

            // Add the child measurement
            measurement[key] = childMeasurement;

            // Clean the measurement according to the Schema
            Collection._c2._simpleSchema.clean(measurement);

            // Update the measurement in the collection
            Collection.update(parentMeasurement._id, { $set: { [key]: measurement[key] } });

            // Update the measurementData ID and measurementNumber
            measurementData._id = parentMeasurement._id;
            measurementData.measurementNumber = parentMeasurement.measurementNumber;
        } else {
            measurement[tool.attribute] = _.extend({}, measurementData, additionalProperties);

            // Get the related timepoint by the measurement number and use its location if defined
            const relatedTimepoint = Collection.findOne({
                measurementNumber: measurement.measurementNumber,
                toolType: tool.parentTool,
                patientId: imageAttributes.patientId
            });

            // Use the related timepoint location if found and defined
            if (relatedTimepoint && relatedTimepoint.location) {
                measurement.location = relatedTimepoint.location;
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
        }

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);
    }

    static onAdded(event, instance, eventData) {
        const { MeasurementApi } = OHIF.measurements;
        const configuration = MeasurementApi.getConfiguration();
        const toolsGroupsMap = MeasurementApi.getToolsGroupsMap();

        const { toolType } = eventData;
        const toolGroupId = toolsGroupsMap[toolType];
        const toolGroup = _.findWhere(configuration.measurementTools, { id: toolGroupId });

        if (!toolGroup) return;

        const tool = _.findWhere(toolGroup.childTools, { id: toolType });
        const params = {
            instance,
            eventData,
            tool,
            toolGroupId,
            toolGroup
        };

        if (tool.parentTool) {
            MeasurementHandlers.handleChildMeasurementAdded(params);
        } else {
            MeasurementHandlers.handleSingleMeasurementAdded(params);
        }
    }

    static handleSingleMeasurementModified({ instance, eventData, tool, toolGroupId, toolGroup }) {
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

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);
    }

    static handleChildMeasurementModified({ instance, eventData, tool, toolGroupId, toolGroup }) {
        const { measurementApi } = instance.data;
        const { measurementData } = eventData;

        const Collection = measurementApi.tools[tool.parentTool];

        // Stop here if the tool data shall not be persisted (e.g. temp tools)
        if (!Collection) return;

        OHIF.log.info('CornerstoneToolsMeasurementModified');

        const measurement = Collection.findOne(measurementData._id);
        const childMeasurement = measurement && measurement[tool.attribute];

        // Stop here if the measurement is already deleted
        if (!childMeasurement) return;

        // Update the collection data with the cornerstone measurement data
        const ignoredKeys = ['location', 'description', 'response'];
        Object.keys(measurementData).forEach(key => {
            if (_.contains(ignoredKeys, key)) return;
            childMeasurement[key] = measurementData[key];
        });

        // If the measurement configuration includes a value for Viewport,
        // we will populate this with the Cornerstone Viewport
        if (Collection._c2._simpleSchema.schema(`${tool.attribute}.viewport`)) {
            childMeasurement.viewport = cornerstone.getViewport(eventData.element);
        }

        // Update the measurement in the collection
        Collection.update(measurement._id, { $set: { [tool.attribute]: childMeasurement } });

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);
    }

    static onModified(event, instance, eventData) {
        const { MeasurementApi } = OHIF.measurements;
        const configuration = MeasurementApi.getConfiguration();
        const toolsGroupsMap = MeasurementApi.getToolsGroupsMap();

        const { toolType } = eventData;
        const toolGroupId = toolsGroupsMap[toolType];
        const toolGroup = _.findWhere(configuration.measurementTools, { id: toolGroupId });

        if (!toolGroup) return;

        const tool = _.findWhere(toolGroup.childTools, { id: toolType });
        const params = {
            instance,
            eventData,
            tool,
            toolGroupId,
            toolGroup
        };

        if (tool.parentTool) {
            MeasurementHandlers.handleChildMeasurementModified(params);
        } else {
            MeasurementHandlers.handleSingleMeasurementModified(params);
        }
    }

    static onRemoved(e, instance, eventData) {
        OHIF.log.info('CornerstoneToolsMeasurementRemoved');
        const measurementData = eventData.measurementData;
        const { measurementApi, timepointApi } = instance.data;
        const Collection = measurementApi.tools[eventData.toolType];

        // Stop here if the tool data shall not be persisted (e.g. temp tools)
        if (!Collection) {
            return;
        }

        const measurementTypeId = measurementApi.toolsGroupsMap[measurementData.toolType];
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
        _.each($('.imageViewerViewport'), element => cornerstone.updateImage(element));

        // Signal unsaved changes
        OHIF.ui.unsavedChanges.set('viewer.studyViewer.measurements.' + eventData.toolType);
    }
}

OHIF.measurements.MeasurementHandlers = MeasurementHandlers;
