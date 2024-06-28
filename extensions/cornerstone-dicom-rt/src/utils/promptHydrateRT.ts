import { ButtonEnums } from '@ohif/ui';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  HYDRATE_SEG: 5,
};

function promptHydrateRT({
  servicesManager,
  rtDisplaySet,
  viewportId,
  toolGroupId = 'default',
  preHydrateCallbacks,
  hydrateRTDisplaySet,
}: withAppTypes) {
  const { uiViewportDialogService } = servicesManager.services;
  const extensionManager = servicesManager._extensionManager;
  const appConfig = extensionManager._appConfig;
  return new Promise(async function (resolve, reject) {
    const promptResult = appConfig?.disableConfirmationPrompts
      ? RESPONSE.HYDRATE_SEG
      : await _askHydrate(uiViewportDialogService, viewportId);

    if (promptResult === RESPONSE.HYDRATE_SEG) {
      preHydrateCallbacks?.forEach(callback => {
        callback();
      });

      window.setTimeout(async () => {
        const isHydrated = await hydrateRTDisplaySet({
          rtDisplaySet,
          viewportId,
          toolGroupId,
          servicesManager,
        });

        resolve(isHydrated);
      }, 0);
    }
  });
}

function _askHydrate(uiViewportDialogService: AppTypes.UIViewportDialogService, viewportId) {
  return new Promise(function (resolve, reject) {
    const message = 'Do you want to open this Segmentation?';
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
