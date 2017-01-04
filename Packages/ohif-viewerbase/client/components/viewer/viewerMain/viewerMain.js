import { OHIF } from 'meteor/ohif:core';
import { unloadHandlers } from '../../../lib/unloadHandlers.js';

Template.viewerMain.onCreated(() => {
    // Attach the Window resize listener
    // Don't use jQuery here. "window.onresize" will always be null
    // If its necessary, check all the code for window.onresize getter
    // and change it to jQuery._data(window, 'events')['resize']. 
    // Otherwise this function will be probably overrided.
    // See cineDialog instance.setResizeHandler function
    window.addEventListener('resize', handleResize);

    // Add beforeUnload event handler to check for unsaved changes
    window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Create the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('CornerstoneNewImage', cornerstoneTools.updateImageSynchronizer);
});

Template.viewerMain.onRendered(() => {
    const instance = Template.instance();

    HP.ProtocolStore.onReady(() => {
        const { studies, currentTimepointId, measurementApi, timepointIds } = instance.data;
        const parentElement = instance.$('#layoutManagerTarget').get(0);
        window.layoutManager = new LayoutManager(parentElement, studies);

        // Default actions for Associated Studies
        if(currentTimepointId) {
            // Follow-up studies: same as the first measurement in the table
            // Baseline studies: target-tool
            if(studies[0]) {
                let activeTool;
                // In follow-ups, get the baseline timepointId
                const timepointId = timepointIds.find(id => id !== currentTimepointId);

                // Follow-up studies
                if(studies[0].timepointType === 'followup' && timepointId) {
                    const measurementTools = OHIF.measurements.MeasurementApi.getConfiguration().measurementTools;

                    // Create list of measurement tools
                    const measurementTypes = measurementTools.map( 
                        tool => {
                            const { id, cornerstoneToolType } = tool;
                            return {
                                id,
                                cornerstoneToolType
                            }
                        }
                    );

                    // Iterate over each measurment tool to find the first baseline
                    // measurment. If so, stops the loop and prevent fetching from all
                    // collections
                    measurementTypes.every(({id, cornerstoneToolType}) => {
                        // Get measurement
                        if(measurementApi[id]) {
                            const measurement = measurementApi[id].findOne({ timepointId });

                            // Found a measurement, save tool and stop loop
                            if(measurement) {
                                activeTool = cornerstoneToolType;

                                return false;
                            }
                        }
                        return true;
                    });
                }

                // If not set, for associated studies default is target-tool
                toolManager.setActiveTool(activeTool || 'bidirectional');
            }

            // Toggle Measurement Table 
            instance.data.state.set('rightSidebar', 'measurements');
        }
        // Hide as default for single study
        else {
            instance.data.state.set('rightSidebar', null);
        }

        ProtocolEngine = new HP.ProtocolEngine(window.layoutManager, studies);
        HP.setEngine(ProtocolEngine);

        // Enable hotkeys
        enableHotkeys();

        Session.set('ViewerMainReady', Random.id());
    });
});

Template.viewerMain.onDestroyed(() => {
    OHIF.log.info('viewerMain onDestroyed');

    // Remove the Window resize listener
    window.removeEventListener('resize', handleResize);

    // Remove beforeUnload event handler...
    window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    delete window.layoutManager;
    delete ProtocolEngine;
});
