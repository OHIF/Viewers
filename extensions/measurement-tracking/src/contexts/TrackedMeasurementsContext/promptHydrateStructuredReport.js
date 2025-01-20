import { hydrateStructuredReport } from '@ohif/extension-cornerstone-dicom-sr';
import { ButtonEnums } from '@ohif/ui';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
  HYDRATE_REPORT: 5,
};

function promptHydrateStructuredReport({ servicesManager, extensionManager, appConfig }, ctx, evt) {
  const { uiViewportDialogService, displaySetService } = servicesManager.services;
  const { viewportId, displaySetInstanceUID } = evt;
  const srDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  return new Promise(async function (resolve, reject) {
    const promptResult = appConfig?.disableConfirmationPrompts
      ? RESPONSE.HYDRATE_REPORT
      : await _askTrackMeasurements(uiViewportDialogService, viewportId);

    // Need to do action here... So we can set state...
    let StudyInstanceUID, SeriesInstanceUIDs;

    if (promptResult === RESPONSE.HYDRATE_REPORT) {
      console.warn('!! HYDRATING STRUCTURED REPORT');
      const hydrationResult = hydrateStructuredReport(
        { servicesManager, extensionManager, appConfig },
        displaySetInstanceUID
      );

      StudyInstanceUID = hydrationResult.StudyInstanceUID;
      SeriesInstanceUIDs = hydrationResult.SeriesInstanceUIDs;
    }

    resolve({
      userResponse: promptResult,
      displaySetInstanceUID: evt.displaySetInstanceUID,
      srSeriesInstanceUID: srDisplaySet.SeriesInstanceUID,
      viewportId,
      StudyInstanceUID,
      SeriesInstanceUIDs,
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

export default promptHydrateStructuredReport;
