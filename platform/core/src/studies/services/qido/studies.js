import { api } from 'dicomweb-client';
import DICOMWeb from '../../../DICOMWeb/';

import errorHandler from '../../../errorHandler';

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
  const config = {
    url: server.qidoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };

  const dicomWeb = new api.DICOMwebClient(config);
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
