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

export const storeMeasurements = (measurementData, filter, server) => {
  OHIF.log.info('[DICOMSR] storeMeasurements');

  if (!server || server.type !== 'dicomWeb') {
    OHIF.log.error('DicomWeb server is required!');
    return Promise.reject({});
  }

  const studyInstanceUid =
    measurementData[Object.keys(measurementData)[0]][0].studyInstanceUid;

  return stowSRFromMeasurements(measurementData, server).then(
    () => {
      OHIF.studies.deleteStudyMetadataPromise(studyInstanceUid);
    },
    error => {
      throw new Error(error);
    }
  );
};
