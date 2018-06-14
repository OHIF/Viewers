import { moment } from 'meteor/momentjs:moment';
import { OHIF } from 'meteor/ohif:core';

export const getExportMeasurementData = async (measurementApi, timepointApi) => {
    const currentTimepoint = timepointApi.current();
    const { timepointId } = currentTimepoint;
    const study = OHIF.viewer.Studies.findBy({
        studyInstanceUid: currentTimepoint.studyInstanceUids[0]
    });
    const { studyDescription, patientId, studyDate } = study;
    const patientName = OHIF.viewerbase.helpers.formatPN(study.patientName);
    
    // All headers
    const measurementData = {
        patientName,
        mrn: patientId,
        studyDate: moment(studyDate).format('MMM DD YYYY'),
        studyDescription,
        data: []
    };

    const addNewMeasurement = async (measurement) => {
        const imageId = OHIF.viewerbase.getImageIdForImagePath(measurement.imagePath);
        const { seriesDescription, seriesDate, modality, seriesInstanceUid } = cornerstone.metaData.get('series', imageId);
        const meanStdDev = measurement.meanStdDev || {};

        measurementData.data.push({
            seriesModality: modality,
            seriesDate: moment(seriesDate).format('MMM DD YYYY'),
            seriesDescription,
            seriesInstanceUid,
            measurementTool: measurement.toolType,
            measurementDescription: OHIF.measurements.getLocationLabel(measurement.location) || 'No description',
            number: measurement.measurementNumber,
            length: measurement.length || '-',
            mean: meanStdDev.mean || '-', 
            stdDev: meanStdDev.stdDev || '-',
            area: measurement.area || '-'
        });
    };

    let allMeasurements = [];
    Object.keys(measurementApi.toolGroups).forEach( toolGroup => {
        let measurements = measurementApi.fetch(toolGroup, { timepointId });
        allMeasurements = allMeasurements.concat(measurements);
    });
    const iterator = allMeasurements[Symbol.iterator]();

    let measurement;
    let current = iterator.next();
    while (!current.done) {
        measurement = current.value;
        await addNewMeasurement(measurement);
        current = iterator.next();
    }
    
    return measurementData;
};
