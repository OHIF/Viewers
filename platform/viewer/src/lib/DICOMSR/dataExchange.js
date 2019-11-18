import OHIF from '@ohif/core';
import { retrieveMeasurementFromSR, stowSRFromMeasurements } from './handleSR';
import { getLatestSRSeries } from './srUtils';

export const retrieveMeasurements = options => {
  OHIF.log.info('[DICOMSR] retrieveMeasurements');

  const { server } = options;
  const latestSeries = getLatestSRSeries();

  if (!latestSeries) return Promise.resolve({});

  return retrieveMeasurementFromSR(latestSeries, server);
};

export const storeMeasurements = async (measurementData, filter, server) => {
  OHIF.log.info('[DICOMSR] storeMeasurements');

  if (!server || server.type !== 'dicomWeb') {
    OHIF.log.error('[DICOMSR] DicomWeb server is required!');
    return Promise.reject({});
  }

  const firstMeasurementKey = Object.keys(measurementData)[0];
  const firstMeasurement = measurementData[firstMeasurementKey][0];
  const studyInstanceUid =
    firstMeasurement && firstMeasurement.studyInstanceUid;

  try {
    await stowSRFromMeasurements(measurementData, server);
    if (studyInstanceUid) {
      OHIF.studies.deleteStudyMetadataPromise(studyInstanceUid);
    }

    return {
      message: 'Measurements were saved with success',
    };
  } catch (error) {
    OHIF.log.error(`Error while saving the measurements: ${error.message}`);
    throw new Error('Error while saving the measurements.');
  }
};
