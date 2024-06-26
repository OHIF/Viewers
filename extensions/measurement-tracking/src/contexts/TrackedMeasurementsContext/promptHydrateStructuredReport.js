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

function _askTrackMeasurements(uiViewportDialogService, viewportId) {
  return new Promise(function (resolve, reject) {
    const message = 'Do you want to continue tracking measurements for this study?';
    const actions = [
      {
        id: 'no-hydrate',
        type: ButtonEnums.type.secondary,
        text: 'No',
        value: RESPONSE.CANCEL,
      },
      {
        id: 'yes-hydrate',
        type: ButtonEnums.type.primary,
        text: 'Yes',
        value: RESPONSE.HYDRATE_REPORT,
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
      onKeyPress: event => {
        if (event.key === 'Enter') {
          const action = actions.find(action => action.value === RESPONSE.HYDRATE_REPORT);
          onSubmit(action.value);
        }
      },
    });
  });
}

export default promptHydrateStructuredReport;
