import { SOPClassHandlerId } from './id';

export default function onModeEnter({ servicesManager }) {
  const { displaySetService } = servicesManager.services;
  const displaySetCache = displaySetService.getDisplaySetCache();

  const srDisplaySets = [...displaySetCache.values()].filter(
    ds => ds.SOPClassHandlerId === SOPClassHandlerId
  );

  srDisplaySets.forEach(ds => {
    // New mode route, allow SRs to be hydrated again
    ds.isHydrated = false;
  });
}
