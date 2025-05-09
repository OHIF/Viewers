const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  HYDRATE_SEG: 5,
};

function promptHydrateRT({
  servicesManager,
  rtDisplaySet,
  viewportId,
  preHydrateCallbacks,
  hydrateRTDisplaySet,
}: withAppTypes) {
  const { uiViewportDialogService, customizationService } = servicesManager.services;
  const extensionManager = servicesManager._extensionManager;
  const appConfig = extensionManager._appConfig;
  return new Promise(async function (resolve, reject) {
    const promptResult = appConfig?.disableConfirmationPrompts
      ? RESPONSE.HYDRATE_SEG
      : await _askHydrate(uiViewportDialogService, customizationService, viewportId);

    if (promptResult === RESPONSE.HYDRATE_SEG) {
      preHydrateCallbacks?.forEach(callback => {
        callback();
      });

      const isHydrated = await hydrateRTDisplaySet({
        rtDisplaySet,
        viewportId,
        servicesManager,
      });

      resolve(isHydrated);
    }
  });
}

function _askHydrate(
  uiViewportDialogService: AppTypes.UIViewportDialogService,
  customizationService: AppTypes.CustomizationService,
  viewportId
) {
  return new Promise(function (resolve, reject) {
    const message = customizationService.getCustomization('viewportNotification.hydrateRTMessage');
    const actions = [
      {
        id: 'no-hydrate',
        type: 'secondary',
        text: 'No',
        value: RESPONSE.CANCEL,
      },
      {
        id: 'yes-hydrate',
        type: 'primary',
        text: 'Yes',
        value: RESPONSE.HYDRATE_SEG,
      },
    ];
    const onSubmit = result => {
      uiViewportDialogService.hide();
      resolve(result);
    };

    uiViewportDialogService.show({
      id: 'promptHydrateRT',
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
          onSubmit(RESPONSE.HYDRATE_SEG);
        }
      },
    });
  });
}

export default promptHydrateRT;
