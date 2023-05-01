import createReportAsync from './../../_shared/createReportAsync';
import createReportDialogPrompt from '../../_shared/createReportDialogPrompt';
import getNextSRSeriesNumber from '../../_shared/getNextSRSeriesNumber';
import RESPONSE from '../../_shared/PROMPT_RESPONSES';

function promptSaveReport(
  { servicesManager, commandsManager, extensionManager },
  ctx,
  evt
) {
  const {
    uiDialogService,
    measurementService,
    displaySetService,
  } = servicesManager.services;
  const viewportIndex =
    evt.viewportIndex === undefined
      ? evt.data.viewportIndex
      : evt.viewportIndex;
  const isBackupSave =
    evt.isBackupSave === undefined ? evt.data.isBackupSave : evt.isBackupSave;
  const StudyInstanceUID = evt?.data?.StudyInstanceUID;
  const SeriesInstanceUID = evt?.data?.SeriesInstanceUID;

  const { trackedStudy, trackedSeries } = ctx;
  let displaySetInstanceUIDs;

  return new Promise(async function(resolve, reject) {
    // TODO: Fallback if (uiDialogService) {
    const promptResult = await createReportDialogPrompt(uiDialogService);

    if (promptResult.action === RESPONSE.CREATE_REPORT) {
      const dataSources = extensionManager.getDataSources();
      const dataSource = dataSources[0];
      const measurements = measurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m =>
          trackedStudy === m.referenceStudyUID &&
          trackedSeries.includes(m.referenceSeriesUID)
      );

      const SeriesDescription =
        // isUndefinedOrEmpty
        promptResult.value === undefined || promptResult.value === ''
          ? 'Research Derived Series' // default
          : promptResult.value; // provided value

      const SeriesNumber = getNextSRSeriesNumber(displaySetService);

      displaySetInstanceUIDs = await createReportAsync(
        servicesManager,
        commandsManager,
        dataSource,
        trackedMeasurements,
        {
          SeriesDescription,
          SeriesNumber,
        }
      );
    } else if (promptResult.action === RESPONSE.CANCEL) {
      // Do nothing
    }

    resolve({
      userResponse: promptResult.action,
      createdDisplaySetInstanceUIDs: displaySetInstanceUIDs,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportIndex,
      isBackupSave,
    });
  });
}

export default promptSaveReport;
