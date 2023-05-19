import hydrateRTDisplaySet from './_hydrateRT';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  HYDRATE_SEG: 5,
};

function promptHydrateRT({
  servicesManager,
  rtDisplaySet,
  viewportIndex,
  toolGroupId = 'default',
}) {
  const { uiViewportDialogService } = servicesManager.services;

  return new Promise(async function(resolve, reject) {
    const promptResult = await _askHydrate(
      uiViewportDialogService,
      viewportIndex
    );

    if (promptResult === RESPONSE.HYDRATE_SEG) {
      const isHydrated = await hydrateRTDisplaySet({
        rtDisplaySet,
        viewportIndex,
        toolGroupId,
        servicesManager,
      });

      resolve(isHydrated);
    }
  });
}

function _askHydrate(uiViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message = 'Do you want to open this Segmentation?';
    const actions = [
      {
        type: 'secondary',
        text: 'No',
        value: RESPONSE.CANCEL,
      },
      {
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

export default promptHydrateRT;
