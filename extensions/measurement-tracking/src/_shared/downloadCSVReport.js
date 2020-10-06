import { DicomMetadataStore } from '@ohif/core';

export default function downloadCSVReport(
  measurementData,
  StudyInstanceUID,
  referencedSeriesInstanceUIDs,
  MeasurementService
) {
  const { VALUE_TYPES } = MeasurementService;

  if (measurementData.length === 0) {
    // Prevent download of report with no measurements.
    return;
  }

  const seriesMetadataMap = {};

  referencedSeriesInstanceUIDs.forEach(SeriesInstanceUID => {
    seriesMetadataMap[SeriesInstanceUID] = DicomMetadataStore.getSeries(
      StudyInstanceUID,
      SeriesInstanceUID
    );
  });

  const rows = [
    [
      'Patient ID',
      'Patient Name',
      'StudyInstanceUID',
      'SeriesInstanceUID',
      'SOPInstanceUID',
      'Label',
      'Long Axis (mm)',
      'Short Axis (mm)',
      'Length (mm)',
      'Area (mmˆ2)',
      'Mean',
      'StDev',
      'Units',
    ],
  ];

  measurementData.forEach(measurement => {
    switch (measurement.type) {
      case VALUE_TYPES.BIDIRECTIONAL:
        rows.push(_getBidirectionalRow(measurement, seriesMetadataMap));
        break;
      case VALUE_TYPES.ELLIPSE:
        rows.push(_getEllipseRow(measurement, seriesMetadataMap));
        break;
      case VALUE_TYPES.POINT:
        rows.push(_getAdditionalFindingRow(measurement, seriesMetadataMap));
        break;
      case VALUE_TYPES.POLYLINE:
        rows.push(_getLengthRow(measurement, seriesMetadataMap));
    }
  });

  let csvContent =
    'data:text/csv;charset=utf-8,' + rows.map(row => row.join(',')).join('\n');

  _createAndDownloadFile(csvContent);
}

function _getBidirectionalRow(measurement, seriesMetadataMap) {
  const commonRowItems = _getCommonRowItems(measurement, seriesMetadataMap);

  return [
    ...commonRowItems,
    measurement.longestDiameter, // Long Axis (mm)
    measurement.shortestDiameter, // Short Axis (mm)
  ];
}

function _getCommonRowItems(measurement, seriesMetadataMap) {
  const seriesMetadata = seriesMetadataMap[measurement.referenceSeriesUID];
  const firstInstance = seriesMetadata.instances[0];

  const row = [
    firstInstance.PatientID, // Patient ID
    firstInstance.PatientName.Alphabetic, // PatientName
    measurement.referenceStudyUID, // StudyInstanceUID
    measurement.referenceSeriesUID, // SeriesInstanceUID
    measurement.SOPInstanceUID, // SOPInstanceUID
    measurement.label || '', // Label
  ];

  return row;
}

function _getAdditionalFindingRow(measurement, seriesMetadataMap) {
  const commonRowItems = _getCommonRowItems(measurement, seriesMetadataMap);

  return [...commonRowItems];
}

function _getEllipseRow(measurement, seriesMetadataMap) {
  const commonRowItems = _getCommonRowItems(measurement, seriesMetadataMap);
  const blankColumns = ['', '', ''];

  const { area, mean, stdDev, unit } = _getEllipseStatsWithUnits(
    measurement,
    seriesMetadataMap
  );

  return [
    ...commonRowItems,
    ...blankColumns,
    area, // Area (mmˆ2)
    mean, // Mean
    stdDev, // StDev
    unit,
  ];
}

function _getEllipseStatsWithUnits(measurement, seriesMetadataMap) {
  const seriesMetadata = seriesMetadataMap[measurement.referenceSeriesUID];
  const firstInstance = seriesMetadata.instances[0];
  const modality = firstInstance.Modality;

  switch (modality) {
    case 'CT':
      return {
        mean: `${measurement.mean.toFixed(1)}`,
        stdDev: `${measurement.stdDev.toFixed(1)}`,
        area: measurement.area.toFixed(1),
        unit: 'HU',
      };
    case 'PT':
      if (measurement.meanSUV) {
        return {
          mean: `${measurement.meanSUV.toFixed(1)}`,
          stdDev: `${measurement.stdDevSUV.toFixed(1)}`,
          area: measurement.area.toFixed(1),
          unit: 'SUV',
        };
      }
    // If no SUV calculation then fallback to default.
    default:
      return {
        mean: `${measurement.mean.toFixed(1)}`,
        stdDev: `${measurement.stdDev.toFixed(1)}`,
        area: measurement.area.toFixed(1),
        unit: 'Pixel Values',
      };
  }
}

function _getLengthRow(measurement, seriesMetadataMap) {
  const commonRowItems = _getCommonRowItems(measurement, seriesMetadataMap);
  const blankColumns = ['', ''];

  return [...commonRowItems, ...blankColumns, measurement.length.toFixed(1)];
}

function _createAndDownloadFile(csvContent) {
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'MeasurementReport.csv');
  document.body.appendChild(link);
  link.click();
}
