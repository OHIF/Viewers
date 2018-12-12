import { OHIF } from 'meteor/ohif:core';

OHIF.viewerbase.getImageDownloadDialogAnnotationTools = () => {
    const { measurementTools } = OHIF.measurements.MeasurementApi.getConfiguration();

    const resultSet = new Set();
    Object.values(measurementTools).forEach(toolGroup => {
        toolGroup.childTools.forEach(tool => {
            if (tool.childTools) return;
            resultSet.add(tool.cornerstoneToolType);
        });
    });

    return Array.from(resultSet);
};
