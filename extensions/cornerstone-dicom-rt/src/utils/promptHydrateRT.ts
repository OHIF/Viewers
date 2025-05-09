import { utils } from '@ohif/extension-cornerstone';

function promptHydrateRT({
  servicesManager,
  rtDisplaySet,
  viewportId,
  preHydrateCallbacks,
  hydrateRTDisplaySet,
}) {
  return utils.promptHydrationDialog({
    servicesManager,
    viewportId,
    displaySet: rtDisplaySet,
    preHydrateCallbacks,
    hydrateCallback: hydrateRTDisplaySet,
    type: 'RT',
  });
}

export default promptHydrateRT;
