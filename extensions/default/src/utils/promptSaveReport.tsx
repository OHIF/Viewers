import createReportAsync from '../Actions/createReportAsync';
import getNextSRSeriesNumber from './getNextSRSeriesNumber';
import PROMPT_RESPONSES from './_shared/PROMPT_RESPONSES';

/**
 * Prompts the user to save a report and handles the report creation process
 * @param services - Object containing required services and managers
 * @param ctx - The current context containing tracked study and series information
 * @param evt - The event object containing viewport and save-related data
 */
async function promptSaveReport(services, ctx, evt) {
  const { servicesManager, extensionManager, commandsManager } = services;

  const { uiDialogService, measurementService, displaySetService, customizationService } =
    servicesManager.services;

  const viewportId = evt.viewportId ?? evt.data?.viewportId;
  const isBackupSave = evt.isBackupSave ?? evt.data?.isBackupSave;
  const { StudyInstanceUID, SeriesInstanceUID } = evt?.data ?? {};

  const { trackedStudy, trackedSeries } = ctx;
  const dataSources = extensionManager.getDataSources();
  const ReportDialog = customizationService.getCustomization('ohif.createReportDialog');

  const dataSourcesList = extensionManager.getDataSourcesForUI();

  uiDialogService.show({
    id: 'report-dialog',
    title: 'Create Report',
    content: ReportDialog,
    contentProps: {
      dataSources: dataSourcesList,
      onSave: async ({ reportName, dataSource }) => {
        const selectedDataSource = dataSource ?? dataSources[0];
        const trackedMeasurements = getTrackedMeasurements(
          measurementService,
          trackedStudy,
          trackedSeries
        );

        const SeriesNumber = getNextSRSeriesNumber(displaySetService);
        const displaySetInstanceUIDs = await handleReportCreation({
          servicesManager,
          commandsManager,
          trackedMeasurements,
          selectedDataSource,
          reportName,
          SeriesNumber,
        });

        return {
          userResponse: PROMPT_RESPONSES.CREATE_REPORT,
          createdDisplaySetInstanceUIDs: displaySetInstanceUIDs,
          StudyInstanceUID,
          SeriesInstanceUID,
          viewportId,
          isBackupSave,
        };
      },
    },
  });
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
