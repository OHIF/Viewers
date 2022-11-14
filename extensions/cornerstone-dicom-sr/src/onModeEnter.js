import { SOPClassHandlerId } from './id';

export default function onModeEnter({ servicesManager }) {
  const { DisplaySetService } = servicesManager.services;
  const displaySetCache = DisplaySetService.getDisplaySetCache();

  const srDisplaySets = displaySetCache.filter(
    ds => ds.SOPClassHandlerId === SOPClassHandlerId
  );

  srDisplaySets.forEach(ds => {
    // New mode route, allow SRs to be hydrated again
    ds.isHydrated = false;
  });
}
