import { ButtonEnums } from '@ohif/ui';
import i18n from 'i18next';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
};

function promptBeginTracking({ servicesManager, extensionManager }, ctx, evt) {
  const { uiViewportDialogService } = servicesManager.services;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID } = evt;

  return new Promise(async function (resolve, reject) {
    let promptResult = await _askTrackMeasurements(uiViewportDialogService, viewportId);

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportId,
    });
  });
}

function _askTrackMeasurements(uiViewportDialogService, viewportId) {
  return new Promise(function (resolve, reject) {
    const message = i18n.t('MeasurementTable:Track measurements for this series?');
    const actions = [
      {
        id: 'prompt-begin-tracking-cancel',
        type: ButtonEnums.type.secondary,
        text: i18n.t('Common:No'),
        value: RESPONSE.CANCEL,
      },
      {
        id: 'prompt-begin-tracking-no-do-not-ask-again',
        type: ButtonEnums.type.secondary,
        text: i18n.t('MeasurementTable:No, do not ask again'),
        value: RESPONSE.NO_NEVER,
      },
      {
        id: 'prompt-begin-tracking-yes',
        type: ButtonEnums.type.primary,
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
    });
  });
}

export default promptBeginTracking;
