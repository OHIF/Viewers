import { api } from 'dicomweb-client';
import StaticWadoClient from './StaticWadoClient';
import DICOMWeb from '../../../DICOMWeb/';

import errorHandler from '../../../errorHandler';
import getXHRRetryRequestHook from '../../../utils/xhrRetryRequestHook';

/**
 * Creates a QIDO date string for a date range query
 * Assumes the year is positive, at most 4 digits long.
 *
 * @param date The Date object to be formatted
 * @returns {string} The formatted date string
 */
function dateToString(date) {
  if (!date) return '';
  let year = date.getFullYear().toString();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  year = '0'.repeat(4 - year.length).concat(year);
  month = '0'.repeat(2 - month.length).concat(month);
  day = '0'.repeat(2 - day.length).concat(day);
  return ''.concat(year, month, day);
}

/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param filter
 * @param serverSupportsQIDOIncludeField
 * @returns {string} The URL with encoded filter query data
 */
function getQIDOQueryParams(filter, serverSupportsQIDOIncludeField) {
  const commaSeparatedFields = [
    '00081030', // Study Description
    '00080060', // Modality
    // Add more fields here if you want them in the result
  ].join(',');

  const parameters = {
    PatientName: filter.PatientName,
    PatientID: filter.PatientID,
    AccessionNumber: filter.AccessionNumber,
    StudyDescription: filter.StudyDescription,
    ModalitiesInStudy: filter.ModalitiesInStudy,
    limit: filter.limit,
    offset: filter.offset,
    fuzzymatching: filter.fuzzymatching,
    includefield: serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all',
  };

  // build the StudyDate range parameter
  if (filter.studyDateFrom || filter.studyDateTo) {
    const dateFrom = dateToString(new Date(filter.studyDateFrom));
    const dateTo = dateToString(new Date(filter.studyDateTo));
    parameters.StudyDate = `${dateFrom}-${dateTo}`;
  }

  // Build the StudyInstanceUID parameter
  if (filter.StudyInstanceUID) {
    let studyUIDs = filter.StudyInstanceUID;
    studyUIDs = Array.isArray(studyUIDs) ? studyUIDs.join() : studyUIDs;
    studyUIDs = studyUIDs.replace(/[^0-9.]+/g, '\\');
    parameters.StudyInstanceUID = studyUIDs;
  }

  // Clean query params of undefined values.
  const params = {};
  Object.keys(parameters).forEach(key => {
    if (parameters[key] !== undefined && parameters[key] !== '') {
      params[key] = parameters[key];
    }
  });

  return params;
}

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */
function resultDataToStudies(resultData) {
  const studies = [];

  if (!resultData || !resultData.length) return;

  resultData.forEach(study =>
    studies.push({
      StudyInstanceUID: DICOMWeb.getString(study['0020000D']),
      // 00080005 = SpecificCharacterSet
      StudyDate: DICOMWeb.getString(study['00080020']),
      StudyTime: DICOMWeb.getString(study['00080030']),
      AccessionNumber: DICOMWeb.getString(study['00080050']),
      referringPhysicianName: DICOMWeb.getString(study['00080090']),
      // 00081190 = URL
      PatientName: DICOMWeb.getName(study['00100010']),
      PatientID: DICOMWeb.getString(study['00100020']),
      PatientBirthdate: DICOMWeb.getString(study['00100030']),
      patientSex: DICOMWeb.getString(study['00100040']),
      studyId: DICOMWeb.getString(study['00200010']),
      numberOfStudyRelatedSeries: DICOMWeb.getString(study['00201206']),
      numberOfStudyRelatedInstances: DICOMWeb.getString(study['00201208']),
      StudyDescription: DICOMWeb.getString(study['00081030']),
      // Modality: DICOMWeb.getString(study['00080060']),
      // ModalitiesInStudy: DICOMWeb.getString(study['00080061']),
      modalities: DICOMWeb.getString(
        DICOMWeb.getModalities(study['00080060'], study['00080061'])
      ),
    })
  );

  return studies;
}

export default function Studies(server, filter) {
  const { staticWado } = server;
  const config = {
    ...server,
    url: server.qidoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
    requestHooks: [getXHRRetryRequestHook()],
  };

  const dicomWeb = staticWado
    ? new StaticWadoClient(config)
    : new api.DICOMwebClient(config);
  server.qidoSupportsIncludeField =
    server.qidoSupportsIncludeField === undefined
      ? true
      : server.qidoSupportsIncludeField;
  const queryParams = getQIDOQueryParams(
    filter,
    server.qidoSupportsIncludeField
  );
  const options = {
    queryParams,
  };

  return dicomWeb.searchForStudies(options).then(resultDataToStudies);
}
