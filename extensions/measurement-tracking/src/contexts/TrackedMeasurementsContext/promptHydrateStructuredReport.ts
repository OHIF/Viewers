import { hydrateStructuredReport } from '@ohif/extension-cornerstone-dicom-sr';
import { utils } from '@ohif/extension-cornerstone';

function promptHydrateStructuredReport(
  { servicesManager, extensionManager, commandsManager, appConfig },
  ctx,
  evt
) {
  const { displaySetService } = servicesManager.services;
  const { viewportId, displaySetInstanceUID } = evt;
  const srDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  const hydrateCallback = async () => {
    return hydrateStructuredReport(
      { servicesManager, extensionManager, commandsManager, appConfig },
      displaySetInstanceUID
    );
  };

  // For SR we need to use the whole context
  const enhancedSrDisplaySet = {
    ...srDisplaySet,
    displaySetInstanceUID,
  };

  return utils.promptHydrationDialog({
    servicesManager,
    viewportId,
    displaySet: enhancedSrDisplaySet,
    hydrateCallback,
    type: 'SR',
  });
}

export default promptHydrateStructuredReport;
