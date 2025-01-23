import { utils } from '@ohif/core';

import createReportAsync from '../Actions/createReportAsync';
import { createReportDialogPrompt } from '../Panels';
import getNextSRSeriesNumber from './getNextSRSeriesNumber';
import PROMPT_RESPONSES from './_shared/PROMPT_RESPONSES';

const {
  filterAnd,
  filterMeasurementsByStudyUID,
  filterMeasurementsBySeriesUID,
  filterAny,
  filterPlanarMeasurement,
} = utils.MeasurementFilters;

async function promptSaveReport({ servicesManager, commandsManager, extensionManager }, ctx, evt) {
  const { uiDialogService, measurementService, displaySetService } = servicesManager.services;
  const viewportId = evt.viewportId === undefined ? evt.data.viewportId : evt.viewportId;
  const isBackupSave = evt.isBackupSave === undefined ? evt.data.isBackupSave : evt.isBackupSave;
  const StudyInstanceUID = evt?.data?.StudyInstanceUID || ctx.trackedStudy;
  const SeriesInstanceUID = evt?.data?.SeriesInstanceUID;

  debugger;
  const {
    trackedSeries,
    measurementFilter = filterAnd(
      filterMeasurementsByStudyUID(StudyInstanceUID),
      trackedSeries ? filterMeasurementsBySeriesUID(trackedSeries) : filterAny,
      filterPlanarMeasurement
    ),
    defaultSaveTitle = 'Research Derived Series',
  } = ctx;
  let displaySetInstanceUIDs;

  try {
    const promptResult = await createReportDialogPrompt(uiDialogService, {
      extensionManager,
    });

    if (promptResult.action === PROMPT_RESPONSES.CREATE_REPORT) {
      const dataSources = extensionManager.getDataSources();
      const dataSource = dataSources[0];
      const measurementData = measurementService.getMeasurements(measurementFilter);

      const SeriesDescription = promptResult.value || defaultSaveTitle;

      const SeriesNumber = getNextSRSeriesNumber(displaySetService);

      const getReport = async () => {
        return commandsManager.runCommand(
          'storeMeasurements',
          {
            measurementData,
            dataSource,
            additionalFindingTypes: ['ArrowAnnotate'],
            options: {
              SeriesDescription,
              SeriesNumber,
            },
          },
          'CORNERSTONE_STRUCTURED_REPORT'
        );
      };
      displaySetInstanceUIDs = await createReportAsync({
        servicesManager,
        getReport,
      });
    } else if (promptResult.action === RESPONSE.CANCEL) {
      // Do nothing
    }

    return {
      userResponse: promptResult.action,
      createdDisplaySetInstanceUIDs: displaySetInstanceUIDs,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportId,
      isBackupSave,
    };
  } catch (error) {
    return null;
  }
}

export default promptSaveReport;
