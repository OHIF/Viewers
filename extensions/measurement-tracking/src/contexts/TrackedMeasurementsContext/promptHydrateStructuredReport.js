import { hydrateStructuredReport } from '@ohif/extension-cornerstone-dicom-sr';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
  HYDRATE_REPORT: 5,
};

function promptHydrateStructuredReport(
  { servicesManager, extensionManager },
  ctx,
  evt
) {
  const {
    uiViewportDialogService,
    displaySetService,
  } = servicesManager.services;
  const { viewportIndex, displaySetInstanceUID } = evt;
  const srDisplaySet = displaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  return new Promise(async function(resolve, reject) {
    const promptResult = await _askTrackMeasurements(
      uiViewportDialogService,
      viewportIndex
    );

    // Need to do action here... So we can set state...
    let StudyInstanceUID, SeriesInstanceUIDs;

    if (promptResult === RESPONSE.HYDRATE_REPORT) {
      console.warn('!! HYDRATING STRUCTURED REPORT');
      const hydrationResult = hydrateStructuredReport(
        { servicesManager, extensionManager },
        displaySetInstanceUID
      );

      StudyInstanceUID = hydrationResult.StudyInstanceUID;
      SeriesInstanceUIDs = hydrationResult.SeriesInstanceUIDs;
    }

    resolve({
      userResponse: promptResult,
      displaySetInstanceUID: evt.displaySetInstanceUID,
      srSeriesInstanceUID: srDisplaySet.SeriesInstanceUID,
      viewportIndex,
      StudyInstanceUID,
      SeriesInstanceUIDs,
    });
  });
}

function _askTrackMeasurements(uiViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message =
      'Do you want to continue tracking measurements for this study?';
    const actions = [
      {
        type: 'secondary',
        text: 'No',
        value: RESPONSE.CANCEL,
      },
      {
        type: 'primary',
        text: 'Yes',
        value: RESPONSE.HYDRATE_REPORT,
      },
    ];
    const onSubmit = result => {
      uiViewportDialogService.hide();
      resolve(result);
    };

    uiViewportDialogService.show({
      viewportIndex,
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

export default promptHydrateStructuredReport;
