const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
};

function promptUser(UIViewportDialogService, ctx, evt) {
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
        text: 'No, do not ask again',
        value: RESPONSE.NO_NEVER,
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

export default promptUser;
