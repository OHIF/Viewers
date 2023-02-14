import { metaData, utilities } from '@cornerstonejs/core';

import OHIF from '@ohif/core';
import dcmjs from 'dcmjs';
import { adaptersSR } from '@cornerstonejs/adapters';

import getFilteredCornerstoneToolState from './utils/getFilteredCornerstoneToolState';

const { MeasurementReport } = adaptersSR.Cornerstone3D;
const { log } = OHIF;

/**
 *
 * @param measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param options Naturalized DICOM JSON headers to merge into the displaySet.
 *
 */
const _generateReport = (
  measurementData,
  additionalFindingTypes,
  options = {}
) => {
  const filteredToolState = getFilteredCornerstoneToolState(
    measurementData,
    additionalFindingTypes
  );

  const report = MeasurementReport.generateReport(
    filteredToolState,
    metaData,
    utilities.worldToImageCoords
  );

  const { dataset } = report;

  // Add in top level series options
  Object.assign(dataset, options);

  // Set the default character set as UTF-8
  // https://dicom.innolitics.com/ciods/nm-image/sop-common/00080005
  if (typeof dataset.SpecificCharacterSet === 'undefined') {
    dataset.SpecificCharacterSet = 'ISO_IR 192';
  }

  return dataset;
};

const commandsModule = ({}) => {
  const actions = {
    /**
     *
     * @param measurementData An array of measurements from the measurements service
     * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
     * @param options Naturalized DICOM JSON headers to merge into the displaySet.
     * as opposed to Finding Sites.
     * that you wish to serialize.
     */
    downloadReport: ({
      measurementData,
      additionalFindingTypes,
      options = {},
    }) => {
      const srDataset = actions.generateReport(
        measurementData,
        additionalFindingTypes,
        options
      );
      const reportBlob = dcmjs.data.datasetToBlob(srDataset);

      //Create a URL for the binary.
      var objectUrl = URL.createObjectURL(reportBlob);
      window.location.assign(objectUrl);
    },

    /**
     *
     * @param measurementData An array of measurements from the measurements service
     * that you wish to serialize.
     * @param dataSource The dataSource that you wish to use to persist the data.
     * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
     * @param options Naturalized DICOM JSON headers to merge into the displaySet.
     * @return The naturalized report
     */
    storeMeasurements: async ({
      measurementData,
      dataSource,
      additionalFindingTypes,
      options = {},
    }) => {
      // TODO -> Eventually use the measurements directly and not the dcmjs adapter,
      // But it is good enough for now whilst we only have cornerstone as a datasource.
      log.info('[DICOMSR] storeMeasurements');

      if (!dataSource || !dataSource.store || !dataSource.store.dicom) {
        log.error(
          '[DICOMSR] datasource has no dataSource.store.dicom endpoint!'
        );
        return Promise.reject({});
      }

      try {
        const naturalizedReport = _generateReport(
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
        throw new Error(
          error.message || 'Error while saving the measurements.'
        );
      }
    },
  };

  const definitions = {
    downloadReport: {
      commandFn: actions.downloadReport,
      storeContexts: [],
      options: {},
    },
    storeMeasurements: {
      commandFn: actions.storeMeasurements,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE_STRUCTURED_REPORT',
  };
};

export default commandsModule;
