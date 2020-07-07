import createReportAsync from './../../_shared/createReportAsync.js';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
};

function promptUser({ servicesManager, extensionManager }, ctx, evt) {
  const {
    UIViewportDialogService,
    MeasurementService,
  } = servicesManager.services;
  const { viewportIndex, StudyInstanceUID, SeriesInstanceUID } = evt;
  const { trackedStudy, trackedSeries } = ctx;

  return new Promise(async function(resolve, reject) {
    let promptResult = await _askShouldAddMeasurements(
      UIViewportDialogService,
      viewportIndex
    );

    if (promptResult === RESPONSE.CREATE_REPORT) {
      promptResult = await _askSaveDiscardOrCancel(
        UIViewportDialogService,
        viewportIndex
      );
    }

    if (promptResult === RESPONSE.CREATE_REPORT) {
      // TODO -> Eventually deal with multiple dataSources.
      // Would need some way of saying which one is the "push" dataSource
      const dataSources = extensionManager.getDataSources();
      const dataSource = dataSources[0];
      const measurements = MeasurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m =>
          trackedStudy === m.referenceStudyUID &&
          trackedSeries.includes(m.referenceSeriesUID)
      );

      createReportAsync(servicesManager, dataSource, trackedMeasurements);
    }

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
    });
  });
}

function _askShouldAddMeasurements(UIViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message =
      'Do you want to add this measurement to the existing report?';
    const actions = [
      { type: 'cancel', text: 'Cancel', value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: 'Create new report',
        value: RESPONSE.CREATE_REPORT,
      },
      {
        type: 'primary',
        text: 'Add to existing report',
        value: RESPONSE.ADD_SERIES,
      },
    ];
    const onSubmit = result => {
      UIViewportDialogService.hide();
      resolve(result);
    };

    UIViewportDialogService.show({
      viewportIndex,
      type: 'info',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        UIViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
    });
  });
}

function _askSaveDiscardOrCancel(UIViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message =
      'You have existing tracked measurements. What would you like to do with your existing tracked measurements?';
    const actions = [
      { type: 'cancel', text: 'Cancel', value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: 'Save in report',
        value: RESPONSE.CREATE_REPORT,
      },
      {
        type: 'primary',
        text: 'Discard',
        value: RESPONSE.SET_STUDY_AND_SERIES,
      },
    ];
    const onSubmit = result => {
      UIViewportDialogService.hide();
      resolve(result);
    };

    UIViewportDialogService.show({
      viewportIndex,
      type: 'warning',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        UIViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
    });
  });
}

export default promptUser;
