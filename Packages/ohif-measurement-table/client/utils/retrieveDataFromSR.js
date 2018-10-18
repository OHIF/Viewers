import { dcmjs } from 'meteor/ohif:cornerstone';
import {getAllDisplaySets, getInstanceMetadata} from './srUtils'

const imagingMeasurementsToMeasurementData = (dataset, displaySets) => {
    const { MeasurementReport } = dcmjs.adapters.Cornerstone;
    const storedMeasurementByToolType = MeasurementReport.generateToolState(dataset);
    const measurementData = {};
    let measurementNumber = 0;

    Object.keys(storedMeasurementByToolType).forEach(toolType => {
        const measurements = storedMeasurementByToolType[toolType];
        measurementData[toolType] = [];

        measurements.forEach(measurement => {
            const instanceMetadata = getInstanceMetadata(displaySets, measurement.sopInstanceUid);
            const imageId = OHIF.viewerbase.getImageId(instanceMetadata);
            if (!imageId) {
                return;
            }

            // TODO: Update the OHIF metadata provider, then switch these to use 'generalSeriesModule'
            const study = cornerstone.metaData.get('study', imageId);
            const series = cornerstone.metaData.get('series', imageId);
            const imagePath = [
                study.studyInstanceUid,
                series.seriesInstanceUid,
                measurement.sopInstanceUid,
                measurement.frameIndex
            ].join('_');

            const toolData = Object.assign({}, measurement, {
                imageId,
                imagePath,
                seriesInstanceUid: series.seriesInstanceUid,
                studyInstanceUid: study.studyInstanceUid,
                patientId: study.patientId,
                measurementNumber: ++measurementNumber,
                timepointId: OHIF.viewer.data.currentTimepointId,
                toolType,
                _id: imageId + measurementNumber,
            });

            measurementData[toolType].push(toolData);
        });
    })

    return measurementData;
};

export default retrieveDataFromSR = (Part10SRArrayBuffer) => {
    const allDisplaySets = getAllDisplaySets();

    // Get the dicom data as an Object
    const dicomData = dcmjs.data.DicomMessage.readFile(Part10SRArrayBuffer);
    const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    // Convert the SR into the kind of object the Measurements package is expecting
    return imagingMeasurementsToMeasurementData(dataset, allDisplaySets);
};
