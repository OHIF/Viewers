import { OHIF } from 'meteor/ohif:core';
import { Session } from 'meteor/session';
import { configureApis } from './configuration/configuration'
import { $ } from 'meteor/jquery';

export class MeasurementTable {
    constructor() {
        configureApis();

        Session.set('TimepointsReady', false);
        Session.set('MeasurementsReady', false);
    }

    onCreated(instance) {
        const { TimepointApi, MeasurementApi } = OHIF.measurements;
        
        OHIF.viewer.data.currentTimepointId = 'TimepointId';
        
        const timepointApi = new TimepointApi(OHIF.viewer.data.currentTimepointId);
        const measurementApi = new MeasurementApi(timepointApi);
        const apis = {
            timepointApi,
            measurementApi
        };
        
        Object.assign(OHIF.viewer, apis);
        Object.assign(instance.data, apis);
        
        const patientId = instance.data.studies[0].patientId;
        
        // LT-382: Preventing HP to keep identifying studies in timepoints that might be removed
        instance.data.studies.forEach(study => (delete study.timepointType));
        
        // TODO: Consider combining the retrieval calls into one?
        const timepointsPromise = timepointApi.retrieveTimepoints({ patientId });
        timepointsPromise.then(() => {
            const timepoints = timepointApi.all();
            
            //  Set timepointType in studies to be used in hanging protocol engine
            timepoints.forEach(timepoint => {
                timepoint.studyInstanceUids.forEach(studyInstanceUid => {
                    const study = _.find(instance.data.studies, element => {
                        return element.studyInstanceUid === studyInstanceUid;
                    });

                    if (!study) {
                        return;
                    }

                    study.timepointType = timepoint.timepointType;
                });
            });
            
            Session.set('TimepointsReady', true);
            
            const timepointIds = timepoints.map(t => t.timepointId);
            
            const measurementsPromise = measurementApi.retrieveMeasurements(patientId, timepointIds);
            measurementsPromise.then(() => {
                Session.set('MeasurementsReady', true);
                
                measurementApi.syncMeasurementsAndToolData();
            });
        });
        
        measurementApi.priorTimepointId = OHIF.viewer.data.currentTimepointId;

        let firstMeasurementActivated = false;
        instance.autorun(() => {
            if (!Session.get('TimepointsReady') ||
            !Session.get('MeasurementsReady') ||
            !Session.get('ViewerReady') ||
            firstMeasurementActivated) {
                return;
            }
            
            this.jumpToFirstMeasurement();
            
        });
        
        instance.measurementModifiedHandler = _.throttle((event, instance) => {
            OHIF.measurements.MeasurementHandlers.onModified(event, instance);
        }, 300);
    }

    onRendered(instance) {
        $('.imageViewerViewport').on('cornerstonetoolsmeasurementadded', function(event) {
                const originalEvent = event.originalEvent;
                OHIF.measurements.MeasurementHandlers.onAdded(originalEvent, instance);
        });
    
        $('.imageViewerViewport').on('cornerstonetoolsmeasurementmodified', function(event) {
            const originalEvent = event.originalEvent;
            instance.measurementModifiedHandler(originalEvent, instance);
        });
    
        $('.imageViewerViewport').on('cornerstonemeasurementremoved', function(event) {
            const originalEvent = event.originalEvent;
            OHIF.measurements.MeasurementHandlers.onRemoved(originalEvent, instance);
        });
    }

    events() {
        return {
            'cornerstonetoolsmeasurementadded .imageViewerViewport'(event, instance) {
                const originalEvent = event.originalEvent;
                OHIF.measurements.MeasurementHandlers.onAdded(originalEvent, instance);
            },
        
            'cornerstonetoolsmeasurementmodified .imageViewerViewport'(event, instance) {
                const originalEvent = event.originalEvent;
                instance.measurementModifiedHandler(originalEvent, instance);
            },
        
            'cornerstonemeasurementremoved .imageViewerViewport'(event, instance) {
                const originalEvent = event.originalEvent;
                OHIF.measurements.MeasurementHandlers.onRemoved(originalEvent, instance);
            }
        }
    }

    onDestroyed() {
        Session.set('TimepointsReady', false);
        Session.set('MeasurementsReady', false);
    }

    jumpToFirstMeasurement() {
        // Find and activate the first measurement by Lesion Number
        // NOTE: This is inefficient, we should be using a hanging protocol
        // to hang the first measurement's imageId immediately, rather
        // than changing images after initial loading...
        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        const tools = config.measurementTools[0].childTools;
        const firstTool = tools[Object.keys(tools)[0]];
        const measurementTypeId = firstTool.id;
        
        const collection = OHIF.viewer.measurementApi.tools[measurementTypeId];
        const sorting = {
            sort: {
                measurementNumber: -1
            }
        };
        
        const data = collection.find({}, sorting).fetch();
        
        // TODO: Clean this up, it's probably an inefficient way to get what we need
        const groupObject = _.groupBy(data, m => m.measurementNumber);
        
        // Reformat the data
        const rows = Object.keys(groupObject).map(key => ({
            measurementTypeId: measurementTypeId,
            measurementNumber: key,
            entries: groupObject[key]
        }));
        
        const rowItem = rows[0];
        
        if (rowItem) {
            OHIF.measurements.jumpToRowItem(rowItem, [OHIF.viewer.data.currentTimepointId]);
        }
        
        this.firstMeasurementActivated = true;
    }
}
