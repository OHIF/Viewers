import { useEffect, useState, memo } from 'react';

const MODALITIES_REQUIRING_CINE_AUTO_MOUNT = ['OT', 'US'];

const ActiveViewportBehavior = memo(
  ({ servicesManager, viewportId }: withAppTypes<{ viewportId: string }>) => {
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

    useEffect(() => {
      if (cineService.isViewportCineClosed(activeViewportId)) {
        return;
      }

      const displaySetInstanceUIDs =
        viewportGridService.getDisplaySetsUIDsForViewport(activeViewportId);

      if (!displaySetInstanceUIDs) {
        return;
      }

      const displaySets = displaySetInstanceUIDs.map(uid =>
        displaySetService.getDisplaySetByUID(uid)
      );

      if (!displaySets.length) {
        return;
      }

      const modalities = displaySets.map(displaySet => displaySet?.Modality);

      const { modalities: sourceModalities } = customizationService.getModeCustomization(
        'autoCineModalities',
        {
          id: 'autoCineModalities',
          modalities: MODALITIES_REQUIRING_CINE_AUTO_MOUNT,
        }
      );

      const requiresCine = modalities.some(modality => sourceModalities.includes(modality));

      if (requiresCine && !cineService.getState().isCineEnabled) {
        cineService.setIsCineEnabled(true);
      }
    }, [
      activeViewportId,
      cineService,
      viewportGridService,
      displaySetService,
      customizationService,
    ]);

    return null;
  },
  arePropsEqual
);

ActiveViewportBehavior.displayName = 'ActiveViewportBehavior';

function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.viewportId === nextProps.viewportId &&
    prevProps.servicesManager === nextProps.servicesManager
  );
}

export default ActiveViewportBehavior;
