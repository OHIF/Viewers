import * as dcmjs from 'dcmjs';
import { DICOMWeb, utils } from '@ohif/core';
import parseDicomStructuredReport from './parseDicomStructuredReport';
import parseMeasurementsData from './parseMeasurementsData';
import getAllDisplaySets from './utils/getAllDisplaySets';

import { api } from 'dicomweb-client';

const VERSION_NAME = 'dcmjs-0.0';
const TRANSFER_SYNTAX_UID = '1.2.840.10008.1.2.1';

const { studyMetadataManager } = utils;

/**
 * Function to retrieve measurements from DICOM Structured Reports coming from determined server
 *
 * @param {Array} series List of all series metaData
 * @param {Object} server
 * @returns {Object} MeasurementData
 */
const retrieveMeasurementFromSR = async (series, server) => {
  const config = {
    url: server.wadoRoot,
    headers: DICOMWeb.getAuthorizationHeader(),
  };

  const dicomWeb = new api.DICOMwebClient(config);

  const instance = series.getFirstInstance();
  const options = {
    studyInstanceUID: instance.getStudyInstanceUID(),
    seriesInstanceUID: instance.getSeriesInstanceUID(),
    sopInstanceUID: instance.getSOPInstanceUID(),
  };

  const part10SRArrayBuffer = await dicomWeb.retrieveInstance(options);
  const displaySets = getAllDisplaySets(studyMetadataManager);
  const measurementsData = parseDicomStructuredReport(part10SRArrayBuffer, displaySets);

  return measurementsData;
};

/**
 * Function to store measurements to DICOM Structured Reports in determined server
 *
 * @param {Object} measurements
 * @param {Object} server
 * @returns {Promise}
 */
const stowSRFromMeasurements = async (measurements, server) => {
  const { dataset } = parseMeasurementsData(
    measurements
  );
  const { DicomMetaDictionary, DicomDict } = dcmjs.data;
  const meta = {
    FileMetaInformationVersion:
      dataset._meta.FileMetaInformationVersion.Value,
    MediaStorageSOPClassUID: dataset.SOPClassUID,
    MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
    TransferSyntaxUID: TRANSFER_SYNTAX_UID,
    ImplementationClassUID: DicomMetaDictionary.uid(),
    ImplementationVersionName: VERSION_NAME,
  };

  const denaturalized = DicomMetaDictionary.denaturalizeDataset(meta);
  const dicomDict = new DicomDict(denaturalized);

  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);

  const part10Buffer = dicomDict.write();

  const config = {
    url: server.wadoRoot,
    headers: DICOMWeb.getAuthorizationHeader(),
  };

  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    datasets: [part10Buffer],
  };

  await dicomWeb.storeInstances(options);
};

export { retrieveMeasurementFromSR, stowSRFromMeasurements };
