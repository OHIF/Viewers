import createReportDialogPrompt from '../../_shared/createReportDialogPrompt';

import createReportAsync from './../../_shared/createReportAsync.js';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

function promptUser({ servicesManager, extensionManager }, ctx, evt) {
  const { UIDialogService, MeasurementService } = servicesManager.services;
  const { StudyInstanceUID, SeriesInstanceUID } = evt;
  const { trackedStudy, trackedSeries } = ctx;

  return new Promise(async function(resolve, reject) {
    // TODO: Fallback if (UIDialogService) {
    const promptResult = await createReportDialogPrompt(UIDialogService);

    if (promptResult.action === RESPONSE.CREATE_REPORT) {
      // TODO: use `promptResult.value` to set seriesDescription
      const dataSources = extensionManager.getDataSources();
      const dataSource = dataSources[0];
      const measurements = MeasurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m =>
          trackedStudy === m.referenceStudyUID &&
          trackedSeries.includes(m.referenceSeriesUID)
      );

      const SeriesDescription = promptResult.value;

      createReportAsync(servicesManager, dataSource, trackedMeasurements, {
        SeriesDescription,
      });
    } else if (promptResult.action === RESPONSE.CANCEL) {
      // Do nothing
    }

    resolve({
      userResponse: promptResult.action,
      StudyInstanceUID,
      SeriesInstanceUID,
    });
  });
}

export default promptUser;
