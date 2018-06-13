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
    let firstItem = true;
    let lineData= [];
    let csvData = '';
    const dataObject = await getExportMeasurementData(measurementApi, timepointApi);

    for(header in headers) {
        lineData.push(headers[header]);
    }
    csvData += lineData.join(columnDelimiter) + lineDelimiter;

    for(measurementLine of dataObject.data) {
        lineData = [];
        lineData.push(dataObject.studyInfo.patientName);
        lineData.push(dataObject.studyInfo.mrn);
        lineData.push(dataObject.studyInfo.studyDate);
        lineData.push(measurementLine.seriesModality);
        lineData.push(measurementLine.seriesDate);
        lineData.push(measurementLine.seriesDescription);
        lineData.push(measurementLine.seriesInstanceUid);
        lineData.push(measurementLine.measurementTool);
        lineData.push(measurementLine.measurementDescription);
        lineData.push(measurementLine.length);
        lineData.push(measurementLine.mean);
        lineData.push(measurementLine.stdDev);
        lineData.push(measurementLine.area);

        csvData += lineData.join(columnDelimiter) + lineDelimiter;
    }

    return csvData;
};