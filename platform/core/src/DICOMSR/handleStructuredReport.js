import dcmjs from 'dcmjs';
import { api } from 'dicomweb-client';

import DICOMWeb from '../DICOMWeb';
import parseDicomStructuredReport from './parseDicomStructuredReport';
import parseMeasurementsData from './parseMeasurementsData';
import getAllDisplaySets from './utils/getAllDisplaySets';
import errorHandler from '../errorHandler';

const VERSION_NAME = 'dcmjs-0.0';
const TRANSFER_SYNTAX_UID = '1.2.840.10008.1.2.1';

/**
 * Function to retrieve measurements from DICOM Structured Reports coming from determined server
 *
 * @param {Array} series - List of all series metaData loaded
 * @param {Array} studies - List of all studies metaData loaded
 * @param {string} serverUrl - Server URL to be used on request
 * @returns {Object} MeasurementData
 */
const retrieveMeasurementFromSR = async (series, studies, serverUrl) => {
  const config = {
    url: serverUrl,
    headers: DICOMWeb.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };

  const dicomWeb = new api.DICOMwebClient(config);

  const instance = series.getFirstInstance();
  const options = {
    studyInstanceUID: instance.getStudyInstanceUID(),
    seriesInstanceUID: instance.getSeriesInstanceUID(),
    sopInstanceUID: instance.getSOPInstanceUID(),
  };

  const part10SRArrayBuffer = await dicomWeb.retrieveInstance(options);
  const displaySets = getAllDisplaySets(studies);
  const measurementsData = parseDicomStructuredReport(
    part10SRArrayBuffer,
    displaySets
  );

  return measurementsData;
};
