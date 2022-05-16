const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

function promptTrackNewStudy({ servicesManager, extensionManager }, ctx, evt) {
  const { UIViewportDialogService } = servicesManager.services;
  const { viewportIndex, StudyInstanceUID, SeriesInstanceUID } = evt;

  return new Promise(async function(resolve, reject) {
    let promptResult = await _askTrackMeasurements(
      UIViewportDialogService,
      viewportIndex
    );

    if (promptResult === RESPONSE.SET_STUDY_AND_SERIES) {
      promptResult = ctx.isDirty
        ? await _askSaveDiscardOrCancel(UIViewportDialogService, viewportIndex)
        : RESPONSE.SET_STUDY_AND_SERIES;
    }

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportIndex,
      isBackupSave: false,
    });
  });
}

function _askTrackMeasurements(UIViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message = 'Track measurements for this series?';
    const actions = [
      { type: 'cancel', text: 'No', value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: 'No, do not ask again for this series',
        value: RESPONSE.NO_NOT_FOR_SERIES,
      },
      {
        type: 'primary',
        text: 'Yes',
        value: RESPONSE.SET_STUDY_AND_SERIES,
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
      'Measurements cannot span across multiple studies. Do you want to save your tracked measurements?';
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

export default promptTrackNewStudy;
