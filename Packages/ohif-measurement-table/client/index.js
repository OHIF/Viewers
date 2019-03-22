import { OHIF } from 'meteor/ohif:core';
import { Session } from 'meteor/session';
import { configureApis } from './configuration/configuration'

class MeasurementTable {
    constructor() {
        configureApis();

        Session.set('TimepointsReady', false);
        Session.set('MeasurementsReady', false);
    }

    async onCreated(instance) {
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
        
        await timepointApi.retrieveTimepoints({ patientId });
        Session.set('TimepointsReady', true);
           
        await measurementApi.retrieveMeasurements(patientId, [OHIF.viewer.data.currentTimepointId]);
        Session.set('MeasurementsReady', false);

        measurementApi.syncMeasurementsAndToolData();
        this.jumpToFirstMeasurement();

        const viewportUtils = OHIF.viewerbase.viewportUtils;
        this.firstMeasurementActivated = false;
        this.dataIsavalible = false;
        instance.autorun(() => {
            if (!Session.get('TimepointsReady') ||
            !Session.get('MeasurementsReady') ||
            !Session.get('ViewerReady') ||
            this.firstMeasurementActivated) {
                if (this.dataIsavalible) {
                    viewportUtils.hideTools();
                    this.dataIsavalible = false;
                }
                return;
            }
            if(!this.dataIsavalible){
                viewportUtils.unhideTools();
                this.dataIsavalible = true;
            }
            
        });
        
        instance.measurementModifiedHandler = _.throttle((event, instance) => {
            OHIF.measurements.MeasurementHandlers.onModified(event, instance);
        }, 300);
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
        const timepoints = [
            OHIF.viewer.timepointApi.current()
        ];

        if (rowItem) {
            OHIF.measurements.jumpToRowItem(rowItem, timepoints);
        }
        
        this.firstMeasurementActivated = true;
    }
    
    static measurementEvents = {
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
    };
};

export {
    MeasurementTable
}
