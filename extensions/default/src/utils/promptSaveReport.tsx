import createReportAsync from '../Actions/createReportAsync';
import getNextSRSeriesNumber from './getNextSRSeriesNumber';
import PROMPT_RESPONSES from './_shared/PROMPT_RESPONSES';
import createReportDialogPrompt from '../Panels/createReportDialogPrompt';

/**
 * Prompts the user to save a report and handles the report creation process
 * @param services - Object containing required services and managers
 * @param ctx - The current context containing tracked study and series information
 * @param evt - The event object containing viewport and save-related data
 */
async function promptSaveReport(services, ctx, evt) {
  const { servicesManager, extensionManager, commandsManager } = services;

  const { measurementService, displaySetService } = servicesManager.services;

  const viewportId = evt.viewportId ?? evt.data?.viewportId;
  const isBackupSave = evt.isBackupSave ?? evt.data?.isBackupSave;
  const { StudyInstanceUID, SeriesInstanceUID } = evt?.data ?? {};

  const { trackedStudy, trackedSeries } = ctx;
  const dataSources = extensionManager.getDataSources();

  const {
    value: reportName,
    dataSourceName: dataSource,
    action,
  } = await createReportDialogPrompt({
    servicesManager,
    extensionManager,
  });
  let displaySetInstanceUIDs;

  try {
    if (action === PROMPT_RESPONSES.CREATE_REPORT) {
      const selectedDataSource = dataSource ?? dataSources[0];
      const trackedMeasurements = getTrackedMeasurements(
        measurementService,
        trackedStudy,
        trackedSeries
      );

      const SeriesNumber = getNextSRSeriesNumber(displaySetService);
      displaySetInstanceUIDs = await handleReportCreation({
        servicesManager,
        commandsManager,
        trackedMeasurements,
        selectedDataSource,
        reportName,
        SeriesNumber,
      });
    }

    return {
      userResponse: action,
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

/**
 * Gets tracked measurements based on study and series criteria
 */
function getTrackedMeasurements(measurementService, trackedStudy, trackedSeries) {
  return measurementService
    .getMeasurements()
    .filter(
      m => trackedStudy === m.referenceStudyUID && trackedSeries.includes(m.referenceSeriesUID)
    )
    .filter(m => m.referencedImageId != null);
}

/**
 * Handles the creation of the report using the measurement service
 */
async function handleReportCreation({
  servicesManager,
  commandsManager,
  trackedMeasurements,
  selectedDataSource,
  reportName,
  SeriesNumber,
}) {
  return createReportAsync({
    servicesManager,
    getReport: () =>
      commandsManager.runCommand(
        'storeMeasurements',
        {
          measurementData: trackedMeasurements,
          dataSource: selectedDataSource,
          additionalFindingTypes: ['ArrowAnnotate'],
          options: {
            SeriesDescription: reportName,
            SeriesNumber,
          },
        },
        'CORNERSTONE_STRUCTURED_REPORT'
      ),
  });
}

export default promptSaveReport;
