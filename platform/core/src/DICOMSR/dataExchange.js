import log from '../log';
import utils from '../utils';
// import {
//   retrieveMeasurementFromSR,
//   stowSRFromMeasurements,
// } from './handleStructuredReport';
import findMostRecentStructuredReport from './utils/findMostRecentStructuredReport';
import * as cornerstone3DTools from '@cornerstonejs/tools';
import * as cornerstone3D from '@cornerstonejs/core';
import dcmjs from 'dcmjs';

const { MeasurementReport } = dcmjs.adapters.Cornerstone3D;

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
    cornerstone3D.metaData
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

function _getFilteredCornerstoneToolState(
  measurementData,
  additionalFindingTypes
) {
  const filteredToolState = {};

  function addToFilteredToolState(annotation, toolType) {
    if (!annotation.metadata?.referencedImageId) {
      log.warn(
        `[DICOMSR] No referencedImageId found for ${toolType} ${annotation.id}`
      );
      return;
    }

    const imageId = annotation.metadata.referencedImageId;

    if (!filteredToolState[imageId]) {
      filteredToolState[imageId] = {};
    }

    const imageIdSpecificToolState = filteredToolState[imageId];

    if (!imageIdSpecificToolState[toolType]) {
      imageIdSpecificToolState[toolType] = {
        data: [],
      };
    }

    const measurmentDataI = measurementData.find(
      md => md.uid === annotation.annotationUID
    );
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

    const measurement = Object.assign({}, annotation, {
      finding,
      findingSites,
    });

    toolData.push(measurement);
  }

  const uidFilter = measurementData.map(md => md.uid);
  const uids = uidFilter.slice();

  const annotationManager = cornerstone3DTools.annotation.state.getDefaultAnnotationManager();
  const framesOfReference = annotationManager.getFramesOfReference();

  for (let i = 0; i < framesOfReference.length; i++) {
    const frameOfReference = framesOfReference[i];

    const frameOfReferenceAnnotations = annotationManager.getFrameOfReferenceAnnotations(
      frameOfReference
    );

    const toolTypes = Object.keys(frameOfReferenceAnnotations);

    for (let j = 0; j < toolTypes.length; j++) {
      const toolType = toolTypes[j];

      const annotations = frameOfReferenceAnnotations[toolType];

      if (annotations) {
        for (let k = 0; k < annotations.length; k++) {
          const annotation = annotations[k];
          const uidIndex = uids.findIndex(
            uid => uid === annotation.annotationUID
          );

          if (uidIndex !== -1) {
            addToFilteredToolState(annotation, toolType);
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
