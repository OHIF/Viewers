import { OHIF } from 'meteor/ohif:core';

/**
 * Activates a specific tool data instance and deactivates all other
 * target and non-target measurement data
 *
 * @param element
 * @param measurementData
 * @param timepointId
 */
OHIF.measurements.activateTool = (element, measurementData, timepointId) => {
    OHIF.measurements.deactivateAllToolData(element, 'bidirectional');
    OHIF.measurements.deactivateAllToolData(element, 'nonTarget');

    // Deactivate CRUNEX Tools
    OHIF.measurements.deactivateAllToolData(element, 'crTool');
    OHIF.measurements.deactivateAllToolData(element, 'unTool');
    OHIF.measurements.deactivateAllToolData(element, 'exTool');

    const toolType = measurementData.toolType;
    const toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) {
        return;
    }

    const measurementAtTimepoint = measurementData.timepoints[timepointId];

    for (let i = 0; i < toolData.data.length; i++) {
        const data = toolData.data[i];

        // When click a row of table measurements, measurement will be active and color will be green
        // TODO= Remove this with the measurementId once it is in the tool data
        if (data.seriesInstanceUid === measurementAtTimepoint.seriesInstanceUid &&
            data.studyInstanceUid === measurementAtTimepoint.studyInstanceUid &&
            data.lesionNumber === measurementData.lesionNumber &&
            data.isTarget === measurementData.isTarget) {

            data.active = true;
            break;
        }
    }

    cornerstone.updateImage(element);
};
