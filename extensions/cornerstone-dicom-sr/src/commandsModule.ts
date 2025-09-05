import { metaData, utilities } from '@cornerstonejs/core';

import OHIF, { DicomMetadataStore, utils } from '@ohif/core';
import dcmjs from 'dcmjs';
import { adaptersSR, NO_IMAGE_ID as ADAPTER_NO_IMAGE_ID } from '@cornerstonejs/adapters';

import getFilteredCornerstoneToolState from './utils/getFilteredCornerstoneToolState';
import hydrateStructuredReport from './utils/hydrateStructuredReport';
const { sopClassDictionary } = utils;


const { MeasurementReport } = adaptersSR.Cornerstone3D;
const { log } = OHIF;

interface Options {
  SeriesDescription?: string;
  SeriesInstanceUID?: string;
  SeriesNumber?: number;
  InstanceNumber?: number;
  SeriesDate?: string;
  SeriesTime?: string;
}

/**
 * @param measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param options Naturalized DICOM JSON headers to merge into the displaySet.
 *
 */
const _generateReport = (measurementData, additionalFindingTypes, options: Options = {}) => {
  console.log('measurementData', measurementData);
  const filteredToolState = getFilteredCornerstoneToolState(
    measurementData,
    additionalFindingTypes
  );



  console.log('_generatereport filteredToolState', filteredToolState);
  console.log('metaData', metaData);
  console.log('utilities.worldToImageCoords', utilities.worldToImageCoords);
  console.log('options', options);
  // log imageId
  console.log('imageId', Object.keys(filteredToolState));


    // After building filteredToolState, before generateReport
  const report = MeasurementReport.generateReport(
    filteredToolState,
    metaData,
    utilities.worldToImageCoords,
    options
  );
  console.log('report', report);
  const { dataset } = report;
  console.log('sopClassUIDsByName', dcmjs?.data?.DicomMetaDictionary?.sopClassUIDsByName);
  // Fallback: ensure SOPClassUID is set (especially for 3D SR when NO_IMAGE_ID is present)
  try {
    const is3DSR = Object.keys(filteredToolState).includes(ADAPTER_NO_IMAGE_ID);
    if (!dataset.SOPClassUID) {
      // Use literal UIDs to avoid dependency on dcmjs dictionary presence
      dataset.SOPClassUID = sopClassDictionary.Comprehensive3DSR;
      console.log('Applied SOPClassUID fallback', dataset.SOPClassUID);
    }
  } catch (e) {
    console.warn('Unable to set SOPClassUID fallback', e);
  }

  // Set the default character set as UTF-8
  // https://dicom.innolitics.com/ciods/nm-image/sop-common/00080005
  if (typeof dataset.SpecificCharacterSet === 'undefined') {
    dataset.SpecificCharacterSet = 'ISO_IR 192';
  }

  dataset.InstanceNumber = options.InstanceNumber ?? 1;

  console.log('dataset', dataset);
  return dataset;
};

const commandsModule = (props: withAppTypes) => {
  const { servicesManager, extensionManager, commandsManager } = props;
  const { customizationService, viewportGridService, displaySetService } = servicesManager.services;

  const actions = {
    changeColorMeasurement: ({ uid }) => {
      // When this gets supported, it probably belongs in cornerstone, not sr
      throw new Error('Unsupported operation: changeColorMeasurement');
      // const { color } = measurementService.getMeasurement(uid);
      // const rgbaColor = {
      //   r: color[0],
      //   g: color[1],
      //   b: color[2],
      //   a: color[3] / 255.0,
      // };
      // colorPickerDialog(uiDialogService, rgbaColor, (newRgbaColor, actionId) => {
      //   if (actionId === 'cancel') {
      //     return;
      //   }

      //   const color = [newRgbaColor.r, newRgbaColor.g, newRgbaColor.b, newRgbaColor.a * 255.0];
      // segmentationService.setSegmentColor(viewportId, segmentationId, segmentIndex, color);
      // });
    },

    /**
     *
     * @param measurementData An array of measurements from the measurements service
     * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
     * @param options Naturalized DICOM JSON headers to merge into the displaySet.
     * as opposed to Finding Sites.
     * that you wish to serialize.
     */
    downloadReport: ({ measurementData, additionalFindingTypes, options = {} }) => {
      const srDataset = _generateReport(measurementData, additionalFindingTypes, options);
      const reportBlob = dcmjs.data.datasetToBlob(srDataset);

      //Create a URL for the binary.
      const objectUrl = URL.createObjectURL(reportBlob);
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
      // Use the @cornerstonejs adapter for converting to/from DICOM
      // But it is good enough for now whilst we only have cornerstone as a datasource.
      log.info('[DICOMSR] storeMeasurements');
      if (!dataSource || !dataSource.store || !dataSource.store.dicom) {
        log.error('[DICOMSR] datasource has no dataSource.store.dicom endpoint!');
        return Promise.reject({});
      }

      try {
        console.log('before _generateReport', measurementData);
        const naturalizedReport = _generateReport(measurementData, additionalFindingTypes, options);
        console.log('naturalizedReport', naturalizedReport);

        const { StudyInstanceUID, ContentSequence } = naturalizedReport;
        // The content sequence has 5 or more elements, of which
        // the `[4]` element contains the annotation data, so this is
        // checking that there is some annotation data present.

        if (!ContentSequence?.[4].ContentSequence?.length) {
          throw new Error('Invalid report, no content');
        }

        const onBeforeDicomStore = customizationService.getCustomization('onBeforeDicomStore');
        console.log('onBeforeDicomStore', onBeforeDicomStore);
        let dicomDict;
        if (typeof onBeforeDicomStore === 'function') {
          dicomDict = onBeforeDicomStore({ dicomDict, measurementData, naturalizedReport });
        }

        // Just before: await dataSource.store.dicom(naturalizedReport, null, dicomDict);
        console.log('SR naturalized dataset', naturalizedReport);
        console.log('SOPClassUID', naturalizedReport.SOPClassUID, 'SpecificCharacterSet', naturalizedReport.SpecificCharacterSet);
        try {
          await dataSource.store.dicom(naturalizedReport, null, dicomDict);
        } catch (e) {
          console.error('STOW error status', e?.response?.status || e?.status);
          console.error('STOW error body', e?.response?.data || e?.xhr?.responseText || e);
          throw e;
        }

        console.log('StudyInstanceUID', StudyInstanceUID);
        if (StudyInstanceUID) {
          dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
        }
        console.log('StudyInstanceUID', StudyInstanceUID);
        // The "Mode" route listens for DicomMetadataStore changes
        // When a new instance is added, it listens and
        // automatically calls makeDisplaySets

        DicomMetadataStore.addInstances([naturalizedReport], true);

        console.log('DicomMetadataStore', DicomMetadataStore);
        return naturalizedReport;
      } catch (error) {
        console.warn(error);
        log.error(`[DICOMSR] Error while saving the measurements: ${error.message}`);
        throw new Error(error.message || 'Error while saving the measurements.');
      }
    },

    /**
     * Loads measurements by hydrating and loading the SR for the given display set instance UID
     * and displays it in the active viewport.
     */
    hydrateStructuredReport: ({ displaySetInstanceUID }) => {
      return hydrateStructuredReport(
        { servicesManager, extensionManager, commandsManager },
        displaySetInstanceUID
      );
    },
  };

  const definitions = {
    downloadReport: actions.downloadReport,
    storeMeasurements: actions.storeMeasurements,
    hydrateStructuredReport: actions.hydrateStructuredReport,
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE_STRUCTURED_REPORT',
  };
};

export default commandsModule;
