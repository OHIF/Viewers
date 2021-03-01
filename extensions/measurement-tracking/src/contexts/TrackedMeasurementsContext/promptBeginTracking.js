const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
};

function promptUser({ servicesManager }, ctx, evt) {
  const { UIViewportDialogService } = servicesManager.services;
  const { viewportIndex, StudyInstanceUID, SeriesInstanceUID } = evt;

  return new Promise(async function(resolve, reject) {
    let promptResult = await _askTrackMeasurements(
      UIViewportDialogService,
      viewportIndex
    );

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportIndex,
    });
  });
}

function _askTrackMeasurements(UIViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message = 'Track measurements for this series?';
    const actions = [
      {
        id: 'prompt-begin-tracking-cancel',
        type: 'cancel',
        text: 'No',
        value: RESPONSE.CANCEL
      },
      {
        id: 'prompt-begin-tracking-no-do-not-ask-again',
        type: 'secondary',
        text: 'No, do not ask again',
        value: RESPONSE.NO_NEVER,
      },
      {
        id: 'prompt-begin-tracking-yes',
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
      id: 'measurement-tracking-prompt-begin-tracking',
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

export default promptUser;
