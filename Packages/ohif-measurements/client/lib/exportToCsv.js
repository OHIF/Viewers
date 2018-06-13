import { OHIF } from 'meteor/ohif:core';
import { getCSVMeasurementData } from '../reports/reportMeasurementDataToCSV';

const downloadCSV = (csvData, args = {}) => {
    let data, link;

    const filename = args.filename || 'export.csv';

    if (csvData == null) return;

    if (!csvData.match(/^data:text\/csv/i)) {
        csvData = 'data:text/csv;charset=utf-8,' + csvData;
    }

    data = encodeURI(csvData);
    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
};

OHIF.measurements.exportCSV = async (measurementApi, timepointApi) => {
    const csvData = await getCSVMeasurementData(measurementApi, timepointApi);
    downloadCSV(csvData);
};
