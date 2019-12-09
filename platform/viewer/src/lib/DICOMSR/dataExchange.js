import { log, studies, utils } from '@ohif/core';
import { retrieveMeasurementFromSR, stowSRFromMeasurements } from './handleStructuredReport';
import findMostRecentStructuredReport from './utils/findMostRecentStructuredReport';

const { studyMetadataManager } = utils;

/**
 * Function to be registered into MeasurementAPI to retrieve measurements from DICOM Structured Reports
 *
 * @param {Object} server
 * @returns {Promise} Should resolve with OHIF measurementData object
 */
const retrieveMeasurements = server => {
  log.info('[DICOMSR] retrieveMeasurements');

  const latestSeries = findMostRecentStructuredReport(studyMetadataManager);

  if (!latestSeries) return Promise.resolve({});

  return retrieveMeasurementFromSR(latestSeries, server);
};

/**
 *  Function to be registered into MeasurementAPI to store measurements into DICOM Structured Reports
 *
 * @param {Object} measurementData
 * @param {Object} filter
 * @param {Object} server
 * @returns {Object} With message to be displayed on success
 */
const storeMeasurements = async (measurementData, filter, server) => {
  log.info('[DICOMSR] storeMeasurements');

  if (!server || server.type !== 'dicomWeb') {
    log.error('[DICOMSR] DicomWeb server is required!');
    return Promise.reject({});
  }

  const firstMeasurementKey = Object.keys(measurementData)[0];
  const firstMeasurement = measurementData[firstMeasurementKey][0];
  const studyInstanceUid =
    firstMeasurement && firstMeasurement.studyInstanceUid;

  try {
    await stowSRFromMeasurements(measurementData, server);
    if (studyInstanceUid) {
      studies.deleteStudyMetadataPromise(studyInstanceUid);
    }

    return {
      message: 'Measurements were saved with success',
    };
  } catch (error) {
    log.error(`[DICOMSR] Error while saving the measurements: ${error.message}`);
    throw new Error('Error while saving the measurements.');
  }
};

export { retrieveMeasurements, storeMeasurements };
