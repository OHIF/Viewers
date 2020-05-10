/**
 * QIDO - Query based on ID for DICOM Objects
 * search for studies, series and instances by patient ID, and receive their
 * unique identifiers for further usage.
 *
 * Quick: https://www.dicomstandard.org/dicomweb/query-qido-rs/
 * Standard: http://dicom.nema.org/medical/dicom/current/output/html/part18.html#sect_10.6
 *
 * Routes:
 * ==========
 * /studies?
 * /studies/{studyInstanceUid}/series?
 * /studies/{studyInstanceUid}/series/{seriesInstanceUid}/instances?
 *
 * Query Parameters:
 * ================
 * | KEY              | VALUE              |
 * |------------------|--------------------|
 * | {attributeId}    | {value}            |
 * | includeField     | {attribute} or all |
 * | fuzzymatching    | true OR false      |
 * | limit            | {number}           |
 * | offset           | {number}           |
 */
import { DICOMWeb } from '@ohif/core';

const { getString, getName, getModalities } = DICOMWeb;

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param {Array} qidoStudies - An array of study objects. Each object contains a keys for DICOM tags.
 * @param {object} qidoStudies[0].qidoStudy - An object where each key is the DICOM Tag group+element
 * @param {object} qidoStudies[0].qidoStudy[dicomTag] - Optional object that represents DICOM Tag
 * @param {string} qidoStudies[0].qidoStudy[dicomTag].vr - Value Representation
 * @param {string[]} qidoStudies[0].qidoStudy[dicomTag].Value - Optional string array representation of the DICOM Tag's value
 * @returns {Array} An array of Study MetaData objects
 */
function processResults(qidoStudies) {
  if (!qidoStudies || !qidoStudies.length) {
    return [];
  }

  const studies = [];

  qidoStudies.forEach(qidoStudy =>
    studies.push({
      studyInstanceUid: getString(qidoStudy['0020000D']),
      studyDate: getString(qidoStudy['00080020']),
      studyTime: getString(qidoStudy['00080030']),
      accessionNumber: getString(qidoStudy['00080050']),
      // referringPhysicianName: getString(qidoStudy['00080090']),
      patientName: getName(qidoStudy['00100010']),
      patientId: getString(qidoStudy['00100020']),
      // patientBirthdate: getString(qidoStudy['00100030']),
      // patientSex: getString(qidoStudy['00100040']),
      // studyId: getString(qidoStudy['00200010']), // mrn?
      // numberOfStudyRelatedSeries: getString(qidoStudy['00201206']),
      instances: getString(qidoStudy['00201208']),
      studyDescription: getString(qidoStudy['00081030']),
      modalities: getString(
        getModalities(qidoStudy['00080060'], qidoStudy['00080061'])
      ),
    })
  );

  return studies;
}

/**
 *
 * @param {object} dicomWebClient - Client similar to what's provided by `dicomweb-client` library
 * @param {function} dicomWebClient.searchForStudies -
 * @param {string} [studyInstanceUid]
 * @param {string} [seriesInstanceUid]
 * @param {string} [queryParamaters]
 * @returns {Promise<results>} - Promise that resolves results
 */
function search(
  dicomWebClient,
  studyInstanceUid,
  seriesInstanceUid,
  queryParamaters
) {
  // const requestFn = studyInstanceUid
  //   ? dicomWebClient.searchForInstances
  //   : dicomWebClient.searchForStudies;

  // TODO: Current version does not apply query Params for `searchForInstances` call?
  // Just sets `studyInstanceUid` in options...
  return dicomWebClient.searchForStudies({
    studyInstanceUid,
    queryParams: queryParamaters,
  });
}

export default function searchStudies(server, filter) {
  const queryParams = getQIDOQueryParams(
    filter,
    server.qidoSupportsIncludeField
  );
  const options = {
    queryParams,
  };

  return dicomWeb.searchForStudies(options).then(resultDataToStudies);
}

/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param filter
 * @param serverSupportsQIDOIncludeField
 * @returns {string} The URL with encoded filter query data
 */
function mapParams(params) {
  if (!params) {
    return;
  }
  const commaSeparatedFields = [
    '00081030', // Study Description
    '00080060', // Modality
    // Add more fields here if you want them in the result
  ].join(',');

  const parameters = {
    PatientName: params.patientName,
    PatientID: params.patientId,
    AccessionNumber: params.accessionNumber,
    StudyDescription: params.studyDescription,
    ModalitiesInStudy: params.modalitiesInStudy,
    limit: params.limit || 101,
    offset: params.offset || 0,
    fuzzymatching: params.fuzzymatching === undefined ? false : true,
    includefield: commaSeparatedFields, // serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all',
  };

  // build the StudyDate range parameter
  if (params.studyDateFrom || params.studyDateTo) {
    const dateFrom = _dateToString(new Date(params.studyDateFrom));
    const dateTo = _dateToString(new Date(params.studyDateTo));
    parameters.StudyDate = `${dateFrom}-${dateTo}`;
  }

  // Build the StudyInstanceUID parameter
  if (params.studyInstanceUid) {
    let studyUids = params.studyInstanceUid;
    studyUids = Array.isArray(studyUids) ? studyUids.join() : studyUids;
    studyUids = studyUids.replace(/[^0-9.]+/g, '\\');
    parameters.StudyInstanceUID = studyUids;
  }

  // Clean query params of undefined values.
  const final = {};
  Object.keys(parameters).forEach(key => {
    if (parameters[key] !== undefined && parameters[key] !== '') {
      final[key] = parameters[key];
    }
  });

  return final;
}

/**
 * Creates a QIDO date string for a date range query
 * Assumes the year is positive, at most 4 digits long.
 *
 * @param date The Date object to be formatted
 * @returns {string} The formatted date string
 */
function _dateToString(date) {
  if (!date) return '';
  let year = date.getFullYear().toString();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  year = '0'.repeat(4 - year.length).concat(year);
  month = '0'.repeat(2 - month.length).concat(month);
  day = '0'.repeat(2 - day.length).concat(day);
  return ''.concat(year, month, day);
}

export { mapParams, search, processResults };
