const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

function promptHasDirtyAnnotations({ servicesManager }: withAppTypes, ctx, evt) {
  const { viewportId, displaySetInstanceUID } = evt.data || evt;

  return new Promise(async function (resolve, reject) {
    const { uiViewportDialogService, customizationService } = servicesManager.services;

    const promptResult = await _askSaveDiscardOrCancel(
      uiViewportDialogService,
      customizationService,
      viewportId
    );

    resolve({
      displaySetInstanceUID,
      userResponse: promptResult,
      viewportId,
      isBackupSave: false,
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
      'viewportNotification.discardDirtyMessage'
    );
    const actions = [
      { id: 'cancel', type: 'cancel', text: 'Cancel', value: RESPONSE.CANCEL },
      {
        id: 'discard-existing',
        type: 'secondary',
        text: 'No, discard existing',
        value: RESPONSE.SET_STUDY_AND_SERIES,
      },
      {
        id: 'save-existing',
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
      id: 'measurement-tracking-prompt-dirty-measurement',
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
          const action = actions.find(action => action.id === 'save-existing');
          onSubmit(action.value);
        }
      },
    });
  });
}

export default promptHasDirtyAnnotations;
