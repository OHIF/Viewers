import { DicomMetadataStore } from '../services/DicomMetadataStore/DicomMetadataStore';
import formatPN from './formatPN';

export default function downloadJSONReport(measurementData) {
  if (measurementData.length === 0) {
    // Prevent download of report with no measurements.
    return;
  }

  const report = {
    metadata: {
      exportDate: new Date().toISOString(),
      exportType: 'JSON',
      measurementCount: measurementData.length,
    },
    measurements: [],
  };

  measurementData.forEach(measurement => {
    const { referenceStudyUID, referenceSeriesUID, getReport, uid } = measurement;

    if (!getReport) {
      console.warn('Measurement does not have a getReport function');
      return;
    }

    try {
      const seriesMetadata = DicomMetadataStore.getSeries(referenceStudyUID, referenceSeriesUID);
      if (!seriesMetadata || !seriesMetadata.instances || !seriesMetadata.instances.length) {
        console.warn('No series metadata found for measurement:', uid);
        return;
      }
      const firstInstance = seriesMetadata.instances[0];

      // Get common metadata
      const commonData = {
        patientID: firstInstance.PatientID,
        patientName: formatPN(firstInstance.PatientName) || '',
        studyInstanceUID: measurement.referenceStudyUID,
        seriesInstanceUID: measurement.referenceSeriesUID,
        sopInstanceUID: measurement.SOPInstanceUID,
        label: measurement.label || '',
      };

      // Get measurement-specific report data
      const measurementReport = getReport(measurement);

      // Create measurement object combining common data and specific measurement data
      const measurementObject = {
        uid: uid,
        ...commonData,
        measurementData: {
          type: measurement.type,
          ...measurementReport,
        },
        // Include full measurement object for advanced use cases
        fullMeasurement: measurement,
      };

      report.measurements.push(measurementObject);
    } catch (error) {
      console.error('Error processing measurement for JSON export:', error);
    }
  });

  // Convert to JSON string with pretty formatting
  const jsonContent = JSON.stringify(report, null, 2);

  // Create and download the file
  _createAndDownloadJSONFile(jsonContent);
}

function _createAndDownloadJSONFile(jsonContent) {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', 'MeasurementReport.json');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}
