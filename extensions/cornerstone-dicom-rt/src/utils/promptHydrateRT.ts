import { utils, Types } from '@ohif/extension-cornerstone';

function promptHydrateRT({
  servicesManager,
  rtDisplaySet,
  viewportId,
  preHydrateCallbacks,
  hydrateRTDisplaySet,
}: {
  servicesManager: AppTypes.ServicesManager;
  rtDisplaySet: AppTypes.DisplaySet;
  viewportId: string;
  preHydrateCallbacks?: Types.HydrationCallback[];
  hydrateRTDisplaySet: Types.HydrationCallback;
}) {
  return utils.promptHydrationDialog({
    servicesManager,
    viewportId,
    displaySet: rtDisplaySet,
    preHydrateCallbacks,
    hydrateCallback: hydrateRTDisplaySet,
    type: 'RTSTRUCT',
  });
}

export default promptHydrateRT;
