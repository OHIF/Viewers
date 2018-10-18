import { OHIF } from 'meteor/ohif:core';
import { dcmjs } from 'meteor/ohif:cornerstone';

export default retrieveDataFromMeasurements = (measurements) => {
    const { MeasurementReport } = dcmjs.adapters.Cornerstone;
    const { getImageIdForImagePath } = OHIF.viewerbase;

    const toolState = {};

    Object.keys(measurements).forEach(measurementType => {
        const annotations = measurements[measurementType];

        annotations.forEach(annotation => {
            const imageId = getImageIdForImagePath(annotation.imagePath);
            toolState[imageId] = toolState[imageId] || {};
            toolState[imageId][annotation.toolType] = toolState[imageId][annotation.toolType] || {
                data: []
            };

            toolState[imageId][annotation.toolType].data.push(annotation);
        });
    })

    const report = MeasurementReport.generateReport(toolState, cornerstone.metaData);

    return report.dataset;
}
