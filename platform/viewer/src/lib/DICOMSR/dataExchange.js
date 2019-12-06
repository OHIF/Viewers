import { log, studies, utils } from '@ohif/core';
import { retrieveMeasurementFromSR, stowSRFromMeasurements } from './handleStructuredReport';
import findMostRecentStructuredReport from './utils/findMostRecentStructuredReport';

const { studyMetadataManager } = utils;

/**
 *
 *
 * @param {*} options
 * @returns
 */
const retrieveMeasurements = options => {
  log.info('[DICOMSR] retrieveMeasurements');

  const { server } = options;
  const latestSeries = findMostRecentStructuredReport(studyMetadataManager);

  if (!latestSeries) return Promise.resolve({});

  return retrieveMeasurementFromSR(latestSeries, server);
};

/**
 *
 *
 * @param {*} measurementData
 * @param {*} filter
 * @param {*} server
 * @returns
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
    log.error(`Error while saving the measurements: ${error.message}`);
    throw new Error('Error while saving the measurements.');
  }
};

export { retrieveMeasurements, storeMeasurements };
