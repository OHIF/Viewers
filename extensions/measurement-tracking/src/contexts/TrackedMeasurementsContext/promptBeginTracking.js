import i18n from 'i18next';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
};

export const measurementTrackingMode = {
  STANDARD: 'standard',
  SIMPLIFIED: 'simplified',
  NONE: 'none',
};

function promptBeginTracking({ servicesManager, extensionManager }, ctx, evt) {
  const { uiViewportDialogService, customizationService } = servicesManager.services;
  const appConfig = extensionManager._appConfig;
  // When the state change happens after a promise, the state machine sends the retult in evt.data;
  // In case of direct transition to the state, the state machine sends the data in evt;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID } = evt.data || evt;

  return new Promise(async function (resolve, reject) {
    const standardMode = appConfig?.measurementTrackingMode === measurementTrackingMode.STANDARD;
    const noTrackingMode = appConfig?.measurementTrackingMode === measurementTrackingMode.NONE;
    let promptResult;

    promptResult = noTrackingMode
      ? RESPONSE.NO_NEVER
      : standardMode
        ? await _askTrackMeasurements(uiViewportDialogService, customizationService, viewportId)
        : RESPONSE.SET_STUDY_AND_SERIES;

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportId,
    });
  });
}

function _askTrackMeasurements(uiViewportDialogService, customizationService, viewportId) {
  return new Promise(function (resolve, reject) {
    const message = customizationService.getCustomization(
      'viewportNotification.beginTrackingMessage'
    );
    const actions = [
      {
        id: 'prompt-begin-tracking-cancel',
        type: 'secondary',
        text: i18n.t('Common:No'),
        value: RESPONSE.CANCEL,
      },
      {
        id: 'prompt-begin-tracking-no-do-not-ask-again',
        type: 'secondary',
        text: i18n.t('MeasurementTable:No, do not ask again'),
        value: RESPONSE.NO_NEVER,
      },
      {
        id: 'prompt-begin-tracking-yes',
        type: 'primary',
        text: i18n.t('Common:Yes'),
        value: RESPONSE.SET_STUDY_AND_SERIES,
      },
    ];
    const onSubmit = result => {
      uiViewportDialogService.hide();
      resolve(result);
    };

    uiViewportDialogService.show({
      viewportId,
      id: 'measurement-tracking-prompt-begin-tracking',
      type: 'info',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        uiViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
      onKeyPress: event => {
        if (event.key === 'Enter') {
          const action = actions.find(action => action.id === 'prompt-begin-tracking-yes');
          onSubmit(action.value);
        }
      },
    });
  });
}

export default promptBeginTracking;
