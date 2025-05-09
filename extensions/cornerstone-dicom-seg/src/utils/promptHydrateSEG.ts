import { utils } from '@ohif/extension-cornerstone';

function promptHydrateSEG({
  servicesManager,
  segDisplaySet,
  viewportId,
  preHydrateCallbacks,
  hydrateCallback,
}) {
  return utils.promptHydrationDialog({
    servicesManager,
    viewportId,
    displaySet: segDisplaySet as AppTypes.DisplaySet,
    preHydrateCallbacks,
    hydrateCallback,
    type: 'SEG',
  });
}

export default promptHydrateSEG;
