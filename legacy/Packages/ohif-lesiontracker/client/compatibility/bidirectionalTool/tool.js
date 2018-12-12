import { Viewerbase } from 'meteor/ohif:viewerbase';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolType } from './definitions';
import createNewMeasurement from './createNewMeasurement';
import addNewMeasurement from './addNewMeasurement';
import addNewMeasurementTouch from './addNewMeasurementTouch';
import onImageRendered from './onImageRendered';
import pointNearTool from './pointNearTool';
import mouseDownCallback from './mouseDownCallback';
import mouseMoveCallback from './mouseMoveCallback';

function createToolInterface() {
    const toolInterface = { toolType };

    const baseInterface = {
        createNewMeasurement,
        onImageRendered,
        pointNearTool,
        toolType
    };

    toolInterface.mouse = cornerstoneTools.mouseButtonTool(Object.assign({
        addNewMeasurement,
        mouseDownCallback,
        mouseMoveCallback
    }, baseInterface));

    toolInterface.touch = cornerstoneTools.touchTool(Object.assign({
        addNewMeasurement: addNewMeasurementTouch
    }, baseInterface));

    return toolInterface;
}

const toolInterface = createToolInterface();
cornerstoneTools[toolType] = toolInterface.mouse;
cornerstoneTools[toolType + 'Touch'] = toolInterface.touch;

// Define an empty location callback
const emptyLocationCallback = (measurementData, eventData, doneCallback) => doneCallback();
const { shadowConfig, textBoxConfig } = Viewerbase.toolManager.getToolDefaultStates();
cornerstoneTools[toolType].setConfiguration({
    getMeasurementLocationCallback: emptyLocationCallback,
    changeMeasurementLocationCallback: emptyLocationCallback,
    textBox: textBoxConfig,
    shadow: shadowConfig
});
