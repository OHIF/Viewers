import i18n from 'i18next';
import { measurementTrackingMode } from './promptBeginTracking';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

function promptTrackNewStudy({ servicesManager, extensionManager }: withAppTypes, ctx, evt) {
  const { uiViewportDialogService, customizationService } = servicesManager.services;
  // When the state change happens after a promise, the state machine sends the retult in evt.data;
  // In case of direct transition to the state, the state machine sends the data in evt;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID } = evt.data || evt;

  return new Promise(async function (resolve, reject) {
    const appConfig = extensionManager._appConfig;

    const standardMode = appConfig?.measurementTrackingMode === measurementTrackingMode.STANDARD;
    const simplifiedMode =
      appConfig?.measurementTrackingMode === measurementTrackingMode.SIMPLIFIED;
    let promptResult = standardMode
      ? await _askTrackMeasurements(uiViewportDialogService, customizationService, viewportId)
      : RESPONSE.SET_STUDY_AND_SERIES;

    if (promptResult === RESPONSE.SET_STUDY_AND_SERIES) {
      promptResult =
        ctx.isDirty && (standardMode || simplifiedMode)
          ? await _askSaveDiscardOrCancel(uiViewportDialogService, customizationService, viewportId)
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

function _askTrackMeasurements(
  UIViewportDialogService: AppTypes.UIViewportDialogService,
  customizationService: AppTypes.CustomizationService,
  viewportId
) {
  return new Promise(function (resolve, reject) {
    const message = customizationService.getCustomization(
      'viewportNotification.trackNewStudyMessage'
    );
    const actions = [
      { type: 'cancel', text: i18n.t('MeasurementTable:No'), value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: i18n.t('MeasurementTable:No, do not ask again'),
        value: RESPONSE.NO_NOT_FOR_SERIES,
      },
      {
        type: 'primary',
        text: i18n.t('MeasurementTable:Yes'),
        value: RESPONSE.SET_STUDY_AND_SERIES,
      },
    ];
    const onSubmit = result => {
      UIViewportDialogService.hide();
      resolve(result);
    };

    UIViewportDialogService.show({
      viewportId,
      type: 'info',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        UIViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
      onKeyPress: event => {
        if (event.key === 'Enter') {
          const action = actions.find(action => action.value === RESPONSE.SET_STUDY_AND_SERIES);
          onSubmit(action.value);
        }
      },
    });
  });
}

function _askSaveDiscardOrCancel(
  UIViewportDialogService: AppTypes.UIViewportDialogService,
  customizationService: AppTypes.CustomizationService,
  viewportId
) {
  return new Promise(function (resolve, reject) {
    const message = customizationService.getCustomization(
      'viewportNotification.discardStudyMessage'
    );
    const actions = [
      { type: 'cancel', text: 'Cancel', value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: 'No, discard previously tracked series & measurements',
        value: RESPONSE.SET_STUDY_AND_SERIES,
      },
      {
        type: 'primary',
        text: 'Yes',
        value: RESPONSE.CREATE_REPORT,
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

export default promptTrackNewStudy;
