import { utils } from '@ohif/core';

import createReportAsync from '../Actions/createReportAsync';
import { createReportDialogPrompt } from '../Panels';
import PROMPT_RESPONSES from './_shared/PROMPT_RESPONSES';

const { filterAnd, filterMeasurementsByStudyUID, filterMeasurementsBySeriesUID } =
  utils.MeasurementFilters;

async function promptSaveReport({ servicesManager, commandsManager, extensionManager }, ctx, evt) {
  const { measurementService, displaySetService } = servicesManager.services;
  const viewportId = evt.viewportId === undefined ? evt.data.viewportId : evt.viewportId;
  const isBackupSave = evt.isBackupSave === undefined ? evt.data.isBackupSave : evt.isBackupSave;
  const StudyInstanceUID = evt?.data?.StudyInstanceUID || ctx.trackedStudy;
  const SeriesInstanceUID = evt?.data?.SeriesInstanceUID;
  const { displaySetInstanceUID } = evt.data ?? evt;

  const {
    trackedSeries,
    measurementFilter = filterAnd(
      filterMeasurementsByStudyUID(StudyInstanceUID),
      filterMeasurementsBySeriesUID(trackedSeries)
    ),
    defaultSaveTitle = 'Create Report',
  } = ctx;
  let displaySetInstanceUIDs;

  const measurementData = measurementService.getMeasurements(measurementFilter);
  const predecessorImageId = findPredecessorImageId(measurementData);

  try {
    const promptResult = await createReportDialogPrompt({
      title: defaultSaveTitle,
      predecessorImageId,
      minSeriesNumber: 3000,
      extensionManager,
      servicesManager,
    });

    if (promptResult.action === PROMPT_RESPONSES.CREATE_REPORT) {
      const dataSources = extensionManager.getDataSources(promptResult.dataSourceName);
      const dataSource = dataSources[0];

      const { series, priorSeriesNumber, value: reportName } = promptResult;
      const SeriesDescription = reportName || defaultSaveTitle;

      const getReport = async () => {
        return commandsManager.runCommand(
          'storeMeasurements',
          {
            measurementData,
            dataSource,
            additionalFindingTypes: ['ArrowAnnotate'],
            options: {
              SeriesDescription,
              SeriesNumber: 1 + priorSeriesNumber,
              predecessorImageId: series,
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
      displaySetInstanceUID,
    };
  } catch (error) {
    console.warn('Unable to save report', error);
    return null;
  }
}

export function findPredecessorImageId(annotations) {
  let predecessorImageId;
  for (const annotation of annotations) {
    if (
      predecessorImageId &&
      annotation.predecessorImageId &&
      annotation.predecessorImageId !== predecessorImageId
    ) {
      console.warn('Found multiple source predecessors, not defaulting to same series');
      return;
    }
    predecessorImageId ||= annotation.predecessorImageId;
  }
  return predecessorImageId;
}

export default promptSaveReport;
