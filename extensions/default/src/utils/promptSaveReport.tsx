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
    defaultSaveTitle = 'Save Measurements',
    defaultSeriesDescription = 'Measurements',
  } = ctx;
  let displaySetInstanceUIDs;

  const measurementData = measurementService.getMeasurements(measurementFilter);
  const predecessorImageId = findPredecessorImageId(measurementData);

  try {
    const promptResult = await createReportDialogPrompt({
      title: defaultSaveTitle,
      predecessorImageId,
      defaultSeriesDescription,
      minSeriesNumber: 3000,
      extensionManager,
      servicesManager,
      enableDownload: true,
    });

    if (promptResult.action === PROMPT_RESPONSES.CREATE_REPORT) {
      const { series, seriesNumber, value: reportName, dataSourceName } = promptResult;
      const SeriesDescription = reportName || defaultSeriesDescription;

      const getReport = async () =>
        commandsManager.runCommand(
          'storeMeasurements',
          {
            measurementData,
            dataSource: dataSourceName,
            additionalFindingTypes: ['ArrowAnnotate'],
            options: {
              SeriesDescription,
              SeriesNumber: seriesNumber,
              predecessorImageId: series,
            },
          },
          'CORNERSTONE_STRUCTURED_REPORT'
        );

      displaySetInstanceUIDs = await createReportAsync({
        servicesManager,
        getReport,
      });

      // The report just written is what these measurements are now stored as, so
      // saving them again offers to extend that series rather than making
      // another one.  Measurements are not reloaded from the report they were
      // stored into, so this is recorded on them directly.
      const storedDisplaySet = displaySetInstanceUIDs?.length
        ? displaySetService.getDisplaySetByUID(displaySetInstanceUIDs[0])
        : undefined;

      if (storedDisplaySet?.predecessorImageId) {
        commandsManager.runCommand('recordMeasurementsPredecessor', {
          measurements: measurementData,
          predecessorImageId: storedDisplaySet.predecessorImageId,
        });
      }
    } else if (promptResult.action === PROMPT_RESPONSES.CANCEL) {
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
