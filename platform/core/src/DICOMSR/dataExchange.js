import log from '../log';
import utils from '../utils';
// import {
//   retrieveMeasurementFromSR,
//   stowSRFromMeasurements,
// } from './handleStructuredReport';
import findMostRecentStructuredReport from './utils/findMostRecentStructuredReport';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import dcmjs from 'dcmjs';

const { MeasurementReport } = dcmjs.adapters.Cornerstone;

/**
 *
 * @typedef serverType
 * @property {string} type - type of the server
 * @property {string} wadoRoot - server wado root url
 *
 */

/**
 * Function to be registered into MeasurementAPI to retrieve measurements from DICOM Structured Reports
 *
 * @param {serverType} server
 * @returns {Promise} Should resolve with OHIF measurementData object
 */
/*const retrieveMeasurements = server => {
  log.info('[DICOMSR] retrieveMeasurements');

  if (!server || server.type !== 'dicomWeb') {
    log.error('[DICOMSR] DicomWeb server is required!');
    return Promise.reject({});
  }

  const serverUrl = server.wadoRoot;
  const studies = utils.studyMetadataManager.all();

  const latestSeries = findMostRecentStructuredReport(studies);

  if (!latestSeries) return Promise.resolve({});

  return retrieveMeasurementFromSR(latestSeries, studies, serverUrl);
};*/

/**
 *
 * @param {object[]} measurementData An array of measurements from the measurements service
 * @param {string[]} additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param {object} options Naturalized DICOM JSON headers to merge into the displaySet.
 * as opposed to Finding Sites.
 * that you wish to serialize.
 */
const downloadReport = (
  measurementData,
  additionalFindingTypes,
  options = {}
) => {
  const srDataset = generateReport(
    measurementData,
    additionalFindingTypes,
    options
  );
  const reportBlob = dcmjs.data.datasetToBlob(srDataset);

  //Create a URL for the binary.
  var objectUrl = URL.createObjectURL(reportBlob);
  window.location.assign(objectUrl);
};

/**
 *
 * @param {object[]} measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param {string[]} additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param {object} options Naturalized DICOM JSON headers to merge into the displaySet.
 *
 */
const generateReport = (
  measurementData,
  additionalFindingTypes,
  options = {}
) => {
  const filteredToolState = _getFilteredCornerstoneToolState(
    measurementData,
    additionalFindingTypes
  );
  const report = MeasurementReport.generateReport(
    filteredToolState,
    cornerstone.metaData
  );

  const { dataset } = report;

  // Add in top level series options
  Object.assign(dataset, options);

  return dataset;
};

/**
 *
 * @param {object[]} measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param {object} dataSource The dataSource that you wish to use to persist the data.
 * @param {string[]} additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param {object} options Naturalized DICOM JSON headers to merge into the displaySet.
 * @return {object} The naturalized report
 */
const storeMeasurements = async (
  measurementData,
  dataSource,
  additionalFindingTypes,
  options = {}
) => {
  // TODO -> Eventually use the measurements directly and not the dcmjs adapter,
  // But it is good enough for now whilst we only have cornerstone as a datasource.
  log.info('[DICOMSR] storeMeasurements');

  if (!dataSource || !dataSource.store || !dataSource.store.dicom) {
    log.error('[DICOMSR] datasource has no dataSource.store.dicom endpoint!');
    return Promise.reject({});
  }

  try {
    const naturalizedReport = generateReport(
      measurementData,
      additionalFindingTypes,
      options
    );
    const { StudyInstanceUID } = naturalizedReport;

    await dataSource.store.dicom(naturalizedReport);

    if (StudyInstanceUID) {
      dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
    }

    return naturalizedReport;
  } catch (error) {
    console.warn(error);
    log.error(
      `[DICOMSR] Error while saving the measurements: ${error.message}`
    );
    throw new Error(error.message || 'Error while saving the measurements.');
  }
};

// _getFilteredCornerstoneToolState
// DIFFERENT IMPLEMENTATION HERE! What's up?
function _getFilteredCornerstoneToolState(
  measurementData,
  additionalFindingTypes
) {
  const uidFilter = measurementData.map(md => md.id);

  const globalToolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();
  const filteredToolState = {};

  function addToFilteredToolState(imageId, toolType, toolDataI) {
    if (!filteredToolState[imageId]) {
      filteredToolState[imageId] = {};
    }

    const imageIdSpecificToolState = filteredToolState[imageId];

    if (!imageIdSpecificToolState[toolType]) {
      imageIdSpecificToolState[toolType] = {
        data: [],
      };
    }

    const measurmentDataI = measurementData.find(md => md.id === toolDataI.id);
    const toolData = imageIdSpecificToolState[toolType].data;

    let finding;
    const findingSites = [];

    // NOTE -> Any kind of freetext value abuses the DICOM standard,
    // As CodeValues should map 1:1 with CodeMeanings.
    // Ideally we would actually use SNOMED codes for this.
    if (measurmentDataI.label) {
      if (additionalFindingTypes.includes(toolType)) {
        finding = {
          CodeValue: 'CORNERSTONEFREETEXT',
          CodingSchemeDesignator: 'CST4',
          CodeMeaning: measurmentDataI.label,
        };
      } else {
        findingSites.push({
          CodeValue: 'CORNERSTONEFREETEXT',
          CodingSchemeDesignator: 'CST4',
          CodeMeaning: measurmentDataI.label,
        });
      }
    }

    const measurement = Object.assign({}, toolDataI, {
      finding,
      findingSites,
    });

    toolData.push(measurement);
  }

  const uids = uidFilter.slice();
  const imageIds = Object.keys(globalToolState);

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageIdSpecificToolState = globalToolState[imageId];

    const toolTypes = Object.keys(imageIdSpecificToolState);

    for (let j = 0; j < toolTypes.length; j++) {
      const toolType = toolTypes[j];
      const toolData = imageIdSpecificToolState[toolType].data;

      if (toolData) {
        for (let k = 0; k < toolData.length; k++) {
          const toolDataK = toolData[k];
          const uidIndex = uids.findIndex(uid => uid === toolDataK.id);

          if (uidIndex !== -1) {
            addToFilteredToolState(imageId, toolType, toolDataK);
            uids.splice(uidIndex, 1);

            if (!uids.length) {
              return filteredToolState;
            }
          }
        }
      }
    }
  }

  return filteredToolState;
}

export { storeMeasurements, downloadReport };
