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
import { DICOMWeb, utils } from '@ohif/core';
import { sortStudySeries } from '@ohif/core/src/utils/sortStudy';

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
      date: getString(qidoStudy['00080020']), // YYYYMMDD
      time: getString(qidoStudy['00080030']), // HHmmss.SSS (24-hour, minutes, seconds, fractional seconds)
      accession: getString(qidoStudy['00080050']) || '', // short string, probably a number?
      mrn: getString(qidoStudy['00100020']) || '', // medicalRecordNumber
      patientName: utils.formatPN(getName(qidoStudy['00100010'])) || '',
      patientBirthDate: getString(qidoStudy['00100030']) || '', // YYYYMMDD
      instances: Number(getString(qidoStudy['00201208'])) || 0, // number
      description: getString(qidoStudy['00081030']) || '',
      modalities: getString(getModalities(qidoStudy['00080060'], qidoStudy['00080061'])) || '',
      referringPhysicianName: utils.formatPN(getName(qidoStudy['00080090'])) || '', // Referring Physician's Name
      // Add custom fields for folder information
      folderName: getString(qidoStudy['00081030']) || '',
      seriesCount: 0,
      totalSlices: Number(getString(qidoStudy['00201208'])) || 0,
    })
  );

  return studies;
}

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param {Array} qidoSeries - An array of study objects. Each object contains a keys for DICOM tags.
 * @param {object} qidoSeries[0].qidoSeries - An object where each key is the DICOM Tag group+element
 * @param {object} qidoSeries[0].qidoSeries[dicomTag] - Optional object that represents DICOM Tag
 * @param {string} qidoSeries[0].qidoSeries[dicomTag].vr - Value Representation
 * @param {string[]} qidoSeries[0].qidoSeries[dicomTag].Value - Optional string array representation of the DICOM Tag's value
 * @returns {Array} An array of Study MetaData objects
 */
export function processSeriesResults(qidoSeries) {
  const series = [];

  if (qidoSeries && qidoSeries.length) {
    qidoSeries.forEach(qidoSeries =>
      series.push({
        studyInstanceUid: getString(qidoSeries['0020000D']),
        seriesInstanceUid: getString(qidoSeries['0020000E']),
        modality: getString(qidoSeries['00080060']),
        seriesNumber: getString(qidoSeries['00200011']),
        seriesDate: utils.formatDate(getString(qidoSeries['00080021'])),
        numSeriesInstances: Number(getString(qidoSeries['00201209'])),
        description: getString(qidoSeries['0008103E']),
      })
    );
  }

  sortStudySeries(series);

  return series;
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
async function search(dicomWebClient, studyInstanceUid, seriesInstanceUid, queryParameters) {
  let searchResult = await dicomWebClient.searchForStudies({
    studyInstanceUid: undefined,
    queryParams: queryParameters,
  });

  return searchResult;
}

/**
 *
 * @param {string} studyInstanceUID - ID of study to return a list of series for
 * @param {string} caseId - Optional caseId for filtering
 * @returns {Promise} - Resolves SeriesMetadata[] in study
 */
export function seriesInStudy(dicomWebClient, studyInstanceUID, caseId) {
  // Series Description
  // Already included?
  const commaSeparatedFields = ['0008103E', '00080021'].join(',');
  const queryParams = {
    includefield: commaSeparatedFields,
  };

  if (caseId) {
    queryParams.caseId = caseId;
    console.log('OHIF qido.js: Adding caseId to series query:', caseId);
  }

  console.log('OHIF qido.js: DicomWebClient object:', dicomWebClient);
  console.log('OHIF qido.js: DicomWebClient.qidoRoot:', dicomWebClient.qidoRoot);
  console.log('OHIF qido.js: DicomWebClient.url:', dicomWebClient.url);
  console.log('OHIF qido.js: DicomWebClient config:', dicomWebClient.config);
  const result = dicomWebClient.searchForSeries({ studyInstanceUID, queryParams });
  console.log('OHIF qido.js: Series query initiated for study:', studyInstanceUID);
  console.log('OHIF qido.js: DicomWebClient URL:', dicomWebClient.qidoRoot);
  return result;
}

// Global variable to store caseId from postMessage
let receivedCaseId = null;

// Listen for postMessage from parent window
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_CASE_ID') {
    receivedCaseId = event.data.caseId;
    console.log('OHIF qido.js: Received caseId via postMessage:', receivedCaseId);
  }
});

export default function searchStudies(server, filter) {
  const queryParams = getQIDOQueryParams(filter, server.qidoSupportsIncludeField);
  
  console.log('OHIF qido.js: window.location.search:', window.location.search);
  console.log('OHIF qido.js: window.location.href:', window.location.href);
  
  // Add caseId from URL if present
  // Try multiple sources: URL params, hash, postMessage, parent window URL, parent window global variable
  let caseId = null;
  
  // Try current window URL search params
  const urlParams = new URLSearchParams(window.location.search);
  caseId = urlParams.get('caseId');
  console.log('OHIF qido.js: caseId from URL search params:', caseId);
  
  // If not found, try hash
  if (!caseId && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    caseId = hashParams.get('caseId');
    console.log('OHIF qido.js: Got caseId from hash:', caseId);
  }
  
  // If not found, try postMessage
  if (!caseId && receivedCaseId) {
    caseId = receivedCaseId;
    console.log('OHIF qido.js: Got caseId from postMessage:', caseId);
  }
  
  // If not found, try parent window URL
  if (!caseId && window.parent !== window) {
    try {
      const parentUrlParams = new URLSearchParams(window.parent.location.search);
      caseId = parentUrlParams.get('caseId');
      console.log('OHIF qido.js: Got caseId from parent window URL:', caseId);
    } catch (e) {
      console.warn('OHIF qido.js: Could not access parent window URL:', e);
    }
  }
  
  // If still not found, try parent window global variable
  if (!caseId && window.parent !== window) {
    try {
      caseId = window.parent.currentCaseId;
      console.log('OHIF qido.js: Got caseId from parent window global variable:', caseId);
    } catch (e) {
      console.warn('OHIF qido.js: Could not access parent window global variable:', e);
    }
  }
  
  if (caseId) {
    console.log('OHIF qido.js: Adding caseId to query:', caseId);
    queryParams.caseId = caseId;
  } else {
    console.warn('OHIF qido.js: caseId is still undefined after trying all sources');
  }
  
  const options = {
    queryParams,
  };

  console.log('OHIF qido.js: Query params sent to server:', queryParams);
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
function mapParams(params, options = {}) {
  if (!params) {
    return;
  }
  const commaSeparatedFields = [
    '00081030', // Study Description
    '00080060', // Modality
    '00080090', // Referring Physician's Name
    '00100030', // Patient's Birth Date
    // Add more fields here if you want them in the result
  ].join(',');

  const useWildcard =
    params?.disableWildcard !== undefined ? !params.disableWildcard : options.supportsWildcard;

  const withWildcard = value => {
    return useWildcard && value ? `*${value}*` : value;
  };

  const parameters = {
    // Named
    PatientName: withWildcard(params.patientName),
    //PatientID: withWildcard(params.patientId),
    '00100020': withWildcard(params.patientId), // Temporarily to make the tests pass with dicomweb-server.. Apparently it's broken?
    AccessionNumber: withWildcard(params.accessionNumber),
    StudyDescription: withWildcard(params.studyDescription),
    ModalitiesInStudy: params.modalitiesInStudy,
    // Other
    limit: params.limit || 101,
    offset: params.offset || 0,
    fuzzymatching: options.supportsFuzzyMatching === true,
    includefield: commaSeparatedFields, // serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all',
  };

  // build the StudyDate range parameter
  if (params.startDate && params.endDate) {
    parameters.StudyDate = `${params.startDate}-${params.endDate}`;
  } else if (params.startDate) {
    const today = new Date();
    const DD = String(today.getDate()).padStart(2, '0');
    const MM = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const YYYY = today.getFullYear();
    const todayStr = `${YYYY}${MM}${DD}`;

    parameters.StudyDate = `${params.startDate}-${todayStr}`;
  } else if (params.endDate) {
    const oldDateStr = `19700102`;

    parameters.StudyDate = `${oldDateStr}-${params.endDate}`;
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

export { mapParams, search, processResults };
