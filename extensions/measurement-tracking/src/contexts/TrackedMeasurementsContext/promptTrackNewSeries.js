import { measurementTrackingMode } from './promptBeginTracking';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

function promptTrackNewSeries({ servicesManager, extensionManager }, ctx, evt) {
  const { UIViewportDialogService, customizationService } = servicesManager.services;
  // When the state change happens after a promise, the state machine sends the retult in evt.data;
  // In case of direct transition to the state, the state machine sends the data in evt;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID } = evt.data || evt;

  return new Promise(async function (resolve, reject) {
    const appConfig = extensionManager._appConfig;

    const showPrompt = appConfig?.measurementTrackingMode === measurementTrackingMode.STANDARD;
    let promptResult = showPrompt
      ? await _askShouldAddMeasurements(UIViewportDialogService, customizationService, viewportId)
      : RESPONSE.ADD_SERIES;

    if (promptResult === RESPONSE.CREATE_REPORT) {
      promptResult = ctx.isDirty
        ? await _askSaveDiscardOrCancel(UIViewportDialogService, customizationService, viewportId)
        : RESPONSE.SET_STUDY_AND_SERIES;
    }

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportId,
      isBackupSave: false,
    });
  });
}

function _askShouldAddMeasurements(uiViewportDialogService, customizationService, viewportId) {
  return new Promise(function (resolve, reject) {
    const message = customizationService.getCustomization(
      'viewportNotification.trackNewSeriesMessage'
    );
    const actions = [
      {
        type: 'secondary',
        text: 'Cancel',
        value: RESPONSE.CANCEL,
      },
      {
        type: 'primary',
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
      uiViewportDialogService.hide();
      resolve(result);
    };

    uiViewportDialogService.show({
      viewportId,
      type: 'info',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        uiViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
    });
  });
}

function _askSaveDiscardOrCancel(UIViewportDialogService, customizationService, viewportId) {
  return new Promise(function (resolve, reject) {
    const message = customizationService.getCustomization(
      'viewportNotification.discardSeriesMessage'
    );

    const actions = [
      { type: 'secondary', text: 'Cancel', value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: 'Save',
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
      viewportId,
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

export default promptTrackNewSeries;
