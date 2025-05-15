import { utils, Types } from '@ohif/extension-cornerstone';

function promptHydrateSEG({
  servicesManager,
  segDisplaySet,
  viewportId,
  preHydrateCallbacks,
  hydrateCallback,
}: {
  servicesManager: AppTypes.ServicesManager;
  segDisplaySet: AppTypes.DisplaySet;
  viewportId: string;
  preHydrateCallbacks?: Types.HydrationCallback[];
  hydrateCallback: Types.HydrationCallback;
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
