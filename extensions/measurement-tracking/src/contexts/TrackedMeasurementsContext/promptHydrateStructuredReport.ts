import { utils } from '@ohif/extension-cornerstone';

function promptHydrateStructuredReport({ servicesManager, commandsManager }, ctx, evt) {
  const { displaySetService } = servicesManager.services;
  const { viewportId, displaySetInstanceUID } = evt;
  const srDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  const hydrateCallback = async () => {
    return commandsManager.runCommand('hydrateSecondaryDisplaySet', {
      displaySet: srDisplaySet,
      viewportId,
    });
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
