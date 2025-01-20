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
  const appConfig = extensionManager._appConfig;
  // When the state change happens after a promise, the state machine sends the retult in evt.data;
  // In case of direct transition to the state, the state machine sends the data in evt;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID } = evt.data || evt;

  return new Promise(async function (resolve, reject) {
    let promptResult = appConfig?.disableConfirmationPrompts
      ? RESPONSE.SET_STUDY_AND_SERIES
      : await _askTrackMeasurements(uiViewportDialogService, viewportId);

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportId,
    });
  });
}

function _askTrackMeasurements(
  UIViewportDialogService: AppTypes.UIViewportDialogService,
  viewportId
) {
  return new Promise(function (resolve, reject) {
    const message = i18n.t('MeasurementTable:Track measurements for this series?');
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
      defaultAction: RESPONSE.SET_STUDY_AND_SERIES, // 添加默认选项
      onOutsideClick: () => {
        UIViewportDialogService.hide();
        resolve(RESPONSE.SET_STUDY_AND_SERIES); // 修改为默认选择track measurement
      },
      onKeyPress: event => {
        if (event.key === 'Enter') {
          onSubmit(RESPONSE.SET_STUDY_AND_SERIES); // 直接使用默认值
        }
      },
    });

    // 自动选择 "Yes" 选项
    setTimeout(() => {
      onSubmit(RESPONSE.SET_STUDY_AND_SERIES);
    }, 0);
  });
}

export default promptBeginTracking;
