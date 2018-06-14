import { getExportMeasurementData } from "./reportMeasurementData";

const columnDelimiter = ',';
const lineDelimiter = '\n';
const headers = {
    patientName: 'Patient Name',
    mrn: 'MRN',
    studyDate: 'Study Date',
    seriesModality: 'Series Modality',
    seriesDate: 'Series Date',
    seriesDescription: 'Series Description',
    seriesInstanceUid: 'Series InstanceUid',
    measurementTool: 'Measurement Tool',
    measurementDescription: 'Measurement Description',
    length: 'Length',
    mean: 'Mean',
    stdDev: 'stdDev',
    area: 'area'
};

export const getCSVMeasurementData = async (measurementApi, timepointApi) => {
    let lineData = [];
    let csvData = '';
    const dataObject = await getExportMeasurementData(measurementApi, timepointApi);

    for(header in headers) {
        lineData.push(headers[header]);
    }
    csvData += lineData.join(columnDelimiter) + lineDelimiter;

    for(measurementLine of dataObject.data) {
        lineData = [
            dataObject.patientName,
            dataObject.mrn,
            dataObject.studyDate,
            measurementLine.seriesModality,
            measurementLine.seriesDate,
            measurementLine.seriesDescription,
            measurementLine.seriesInstanceUid,
            measurementLine.measurementTool,
            measurementLine.measurementDescription,
            measurementLine.length,
            measurementLine.mean,
            measurementLine.stdDev,
            measurementLine.area
        ];
        csvData += lineData.join(columnDelimiter) + lineDelimiter;
    }

    return csvData;
};