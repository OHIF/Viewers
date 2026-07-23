import { metaData } from '@cornerstonejs/core';

import OHIF from '@ohif/core';
import { adaptersSR } from '@cornerstonejs/adapters';

import getFilteredCornerstoneToolState from './utils/getFilteredCornerstoneToolState';
import hydrateStructuredReport from './utils/hydrateStructuredReport';

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
  const filteredToolState = getFilteredCornerstoneToolState(
    measurementData,
    additionalFindingTypes
  );

  const report = MeasurementReport.generateReport(filteredToolState, metaData, options);

  const { dataset } = report;

  // Set the default character set as UTF-8
  // https://dicom.innolitics.com/ciods/nm-image/sop-common/00080005
  if (typeof dataset.SpecificCharacterSet === 'undefined') {
    dataset.SpecificCharacterSet = 'ISO_IR 192';
  }

  return dataset;
};

const commandsModule = (props: withAppTypes) => {
  const { servicesManager, extensionManager, commandsManager } = props;
  const { customizationService } = servicesManager.services;

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
     * that you wish to serialize.
     * @param dataSource The data source name ('download', 'copyToClipboard', or a named data source).
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
      log.info('[DICOMSR] storeMeasurements');

      const storeFn = commandsManager.runCommand('createStoreFunction', {
        dataSource,
        defaultFileName: 'dicom-sr.dcm',
      });

      if (!storeFn) {
        log.error('[DICOMSR] No valid store for dataSource:', dataSource);
        return Promise.reject({});
      }

      try {
        const naturalizedReport = _generateReport(
          measurementData,
          additionalFindingTypes,
          options
        );

        const { ContentSequence } = naturalizedReport;
        // The content sequence has 5 or more elements, of which
        // the `[4]` element contains the annotation data, so this is
        // checking that there is some annotation data present.
        if (!ContentSequence?.[4]?.ContentSequence?.length) {
          console.log('naturalizedReport missing imaging content', naturalizedReport);
          throw new Error('Invalid report, no content');
        }
        if (!naturalizedReport.SOPClassUID) {
          throw new Error('No sop class uid');
        }

        const onBeforeDicomStore = customizationService.getCustomization('onBeforeDicomStore');
        let dicomDict;
        if (typeof onBeforeDicomStore === 'function') {
          dicomDict = onBeforeDicomStore({ dicomDict, measurementData, naturalizedReport });
        }

        await storeFn(naturalizedReport, { measurementData, dicomDict });

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
