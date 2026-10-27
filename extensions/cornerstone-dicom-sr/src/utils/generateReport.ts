import { metaData } from '@cornerstonejs/core';
import { adaptersSR, version as adaptersVersion } from '@cornerstonejs/adapters';
import { utils } from '@ohif/core';

import getFilteredCornerstoneToolState from './getFilteredCornerstoneToolState';

const { MeasurementReport } = adaptersSR.Cornerstone3D;

export interface GenerateReportOptions {
  SeriesDescription?: string;
  SeriesInstanceUID?: string;
  SeriesNumber?: number;
  InstanceNumber?: number;
  SeriesDate?: string;
  SeriesTime?: string;
  Manufacturer?: string;
  ManufacturerModelName?: string;
  SoftwareVersions?: string | string[];
}

/**
 * Builds the naturalized SR dataset of the given measurements.
 *
 * @param measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param options Naturalized DICOM JSON headers to merge into the displaySet.
 * The writer header (`Manufacturer`, `ManufacturerModelName`, `SoftwareVersions`)
 * defaults to OHIF and the adapters version; a value in `options` wins.
 */
export default function generateReport(
  measurementData,
  additionalFindingTypes,
  options: GenerateReportOptions = {}
) {
  const filteredToolState = getFilteredCornerstoneToolState(
    measurementData,
    additionalFindingTypes
  );

  const report = MeasurementReport.generateReport(filteredToolState, metaData, {
    ...utils.getOhifWriterHeader('@cornerstonejs/adapters', 'CS3D', adaptersVersion),
    ...options,
  });

  const { dataset } = report;

  // Set the default character set as UTF-8
  // https://dicom.innolitics.com/ciods/nm-image/sop-common/00080005
  if (typeof dataset.SpecificCharacterSet === 'undefined') {
    dataset.SpecificCharacterSet = 'ISO_IR 192';
  }

  return dataset;
}
