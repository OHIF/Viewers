import { dcmjs } from 'meteor/ohif:cornerstone';

export default retrieveDataFromMeasurements = (measurements) => {
    const { MeasurementReport } = dcmjs.adapters.Cornerstone;
    const report = MeasurementReport.generateReport(measurements, cornerstone.metadata);

    return report.dataset;
}
