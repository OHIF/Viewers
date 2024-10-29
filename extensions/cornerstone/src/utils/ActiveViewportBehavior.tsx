import { useEffect, useState } from 'react';

const MODALITIES_REQUIRING_CINE_AUTO_MOUNT = ['OT', 'US'];

function ActiveViewportBehavior({
  servicesManager,
  viewportId,
}: withAppTypes<{ viewportId: string }>) {
  const { displaySetService, cineService, viewportGridService, customizationService } =
    servicesManager.services;

  const [activeViewportId, setActiveViewportId] = useState(viewportId);

  useEffect(() => {
    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      ({ viewportId }) => setActiveViewportId(viewportId)
    );

    return () => subscription.unsubscribe();
  }, [viewportId, viewportGridService]);

  const state = cineService.getState();

  if (cineService.isViewportCineClosed(activeViewportId)) {
    return null;
  }

  const displaySetInstanceUIDs =
    viewportGridService.getDisplaySetsUIDsForViewport(activeViewportId);

  if (!displaySetInstanceUIDs) {
    return null;
  }

  const displaySets = displaySetInstanceUIDs.map(uid => displaySetService.getDisplaySetByUID(uid));

  const modalities = displaySets.map(displaySet => displaySet.Modality);

  const { modalities: sourceModalities } = customizationService.getModeCustomization(
    'autoCineModalities',
    {
      id: 'autoCineModalities',
      modalities: MODALITIES_REQUIRING_CINE_AUTO_MOUNT,
    }
  );

  const requiresCine = modalities.some(modality => sourceModalities.includes(modality));

  if (requiresCine && !state.isCineEnabled) {
    cineService.setIsCineEnabled(true);
  }

  return null;
}

export default ActiveViewportBehavior;
