import OHIF from '@ohif/core';
import { retrieveMeasurementFromSR, stowSRFromMeasurements } from './handleSR';
import { getLatestSRSeries } from './srUtils';

export const retrieveMeasurements = () => {
  console.info('[DICOMSR] retrieveMeasurements');

  const latestSeries = getLatestSRSeries();

  if (!latestSeries) return Promise.resolve({});

  return retrieveMeasurementFromSR(latestSeries);
};

export const storeMeasurements = (measurementData, filter) => {
  console.info('[DICOMSR] storeMeasurements');

  // TODO SR: Come back with this when we have access to the server here and throw an error if its not dicomWeb
  // if (!server || server.type !== 'dicomWeb') {
  //   return Promise.reject({});
  // }

  const studyInstanceUid =
    measurementData[Object.keys(measurementData)[0]][0].studyInstanceUid;

  return stowSRFromMeasurements(measurementData).then(
    () => {
      OHIF.studies.deleteStudyMetadataPromise(studyInstanceUid);
    },
    error => {
      throw new Error(error);
    }
  );
};
