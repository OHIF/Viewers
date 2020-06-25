import log from '../log';
import studies from '../studies';
import utils from '../utils';
import {
  retrieveMeasurementFromSR,
  stowSRFromMeasurements,
} from './handleStructuredReport';
import findMostRecentStructuredReport from './utils/findMostRecentStructuredReport';
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
const retrieveMeasurements = server => {
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
};

/**
 *  Function to be registered into MeasurementAPI to store measurements into DICOM Structured Reports
 *
 * @param {Object} measurementData - OHIF measurementData object
 * @param {Object} filter
 * @param {serverType} server
 * @returns {Object} With message to be displayed on success
 */
const storeMeasurementsOld = async (measurementData, filter, server) => {
  log.info('[DICOMSR] storeMeasurements');

  if (!server || server.type !== 'dicomWeb') {
    log.error('[DICOMSR] DicomWeb server is required!');
    return Promise.reject({});
  }

  const serverUrl = server.wadoRoot;
  const firstMeasurementKey = Object.keys(measurementData)[0];
  const firstMeasurement = measurementData[firstMeasurementKey][0];
  const StudyInstanceUID =
    firstMeasurement && firstMeasurement.StudyInstanceUID;

  try {
    await stowSRFromMeasurements(measurementData, serverUrl);
    if (StudyInstanceUID) {
      studies.deleteStudyMetadataPromise(StudyInstanceUID);
    }

    return {
      message: 'Measurements saved successfully',
    };
  } catch (error) {
    log.error(
      `[DICOMSR] Error while saving the measurements: ${error.message}`
    );
    throw new Error('Error while saving the measurements.');
  }
};

const downloadReport = measurementData => {
  const srDataset = generateReport(measurementData);
  const reportBlob = dcmjs.data.datasetToBlob(srDataset);

  //Create a URL for the binary.
  var objectUrl = URL.createObjectURL(reportBlob);
  window.location.assign(objectUrl);
};

const generateReport = measurementData => {
  const ids = measurementData.map(md => md.id);
  const filteredToolState = _getFilteredCornerstoneToolState(ids);

  const report = MeasurementReport.generateReport(
    filteredToolState,
    cornerstone.metaData
  );

  return report.dataset;
};

const storeMeasurements = async (measurementData, dataSource) => {
  // TODO -> Eventually use the measurements directly and not the dcmjs adapter,
  // But it is good enough for now whilst we only have cornerstone as a datasource.
  log.info('[DICOMSR] storeMeasurements');

  if (!dataSource || !dataSource.store || !dataSource.store.dicom) {
    log.error('[DICOMSR] datasource has no dataSource.store.dicom endpoint!');
    return Promise.reject({});
  }

  const naturalizedReport = generateReport(measurementData);
  const { StudyInstanceUID } = naturalizedReport;

  try {
    await dataSource.store.dicom(naturalizedReport);

    if (StudyInstanceUID) {
      studies.deleteStudyMetadataPromise(StudyInstanceUID);
    }

    return {
      message: 'Measurements saved successfully',
    };
  } catch (error) {
    log.error(
      `[DICOMSR] Error while saving the measurements: ${error.message}`
    );
    throw new Error('Error while saving the measurements.');
  }
};

function _getFilteredCornerstoneToolState(uidFilter) {
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

    const toolData = imageIdSpecificToolState[toolType].data;

    toolData.push(toolDataI);
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

export { retrieveMeasurements, storeMeasurements, downloadReport };
