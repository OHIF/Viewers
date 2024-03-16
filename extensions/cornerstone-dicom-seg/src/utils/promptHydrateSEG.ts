import { ButtonEnums } from '@ohif/ui';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  HYDRATE_SEG: 5,
};

function promptHydrateSEG({
  servicesManager,
  segDisplaySet,
  viewportId,
  preHydrateCallbacks,
  hydrateSEGDisplaySet,
}) {
  const { uiViewportDialogService } = servicesManager.services;

  return new Promise(async function (resolve, reject) {
    const promptResult = await _askHydrate(uiViewportDialogService, viewportId);

    if (promptResult === RESPONSE.HYDRATE_SEG) {
      preHydrateCallbacks?.forEach(callback => {
        callback();
      });

      const isHydrated = await hydrateSEGDisplaySet({
        segDisplaySet,
        viewportId,
      });

      resolve(isHydrated);
    }
  });
}

function _askHydrate(uiViewportDialogService, viewportId) {
  return new Promise(function (resolve, reject) {
    const message = 'Do you want to open this Segmentation?';
    const actions = [
      {
        type: ButtonEnums.type.secondary,
        text: 'No',
        value: RESPONSE.CANCEL,
      },
      {
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
      viewportId,
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

export default promptHydrateSEG;
