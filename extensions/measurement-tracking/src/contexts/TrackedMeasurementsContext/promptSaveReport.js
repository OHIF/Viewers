import createReportAsync from './../../_shared/createReportAsync.js';
import createReportDialogPrompt from '../../_shared/createReportDialogPrompt';
import getNextSRSeriesNumber from '../../_shared/getNextSRSeriesNumber';
import RESPONSE from '../../_shared/PROMPT_RESPONSES';

function promptUser({ servicesManager, extensionManager }, ctx, evt) {
  const {
    UIDialogService,
    MeasurementService,
    DisplaySetService,
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
    // TODO: Fallback if (UIDialogService) {
    const promptResult = await createReportDialogPrompt(UIDialogService);

    if (promptResult.action === RESPONSE.CREATE_REPORT) {
      const dataSources = extensionManager.getDataSources();
      const dataSource = dataSources[0];
      const measurements = MeasurementService.getMeasurements();
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

      const SeriesNumber = getNextSRSeriesNumber(DisplaySetService);

      displaySetInstanceUIDs = await createReportAsync(
        servicesManager,
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

export default promptUser;
