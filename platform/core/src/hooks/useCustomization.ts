import { useState, useEffect } from 'react';
import { useSystem } from '../contextProviders/SystemProvider';

/**
 * Reads a customization and re-renders when customizations change.
 *
 * `customizationService.getCustomization` called directly during render
 * captures whatever is registered at that moment. Registration order is not
 * guaranteed: mode-scope customizations are registered in `mode.onModeEnter`,
 * which can run after panels have already rendered, and both the React
 * Compiler (which memoizes the call on the stable service reference) and
 * components that snapshot the value would then keep serving the stale
 * pre-registration value. This hook subscribes to the service's modification
 * events, so consumers always converge on the currently registered value.
 *
 * The setState updater form is used everywhere because a customization value
 * may itself be a function.
 */
export function useCustomization<T = unknown>(customizationId: string): T {
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  const [value, setValue] = useState<T>(
    () => customizationService.getCustomization(customizationId) as T
  );

  useEffect(() => {
    const update = () => {
      // getCustomization caches the transformed value in
      // `transformedCustomizations`, so as long as nothing has invalidated that
      // cache an unchanged customization returns the same reference and
      // setState bails out. Every setter clears the cache before broadcasting,
      // so the read right after an event does re-run transform/reference
      // resolution - values that resolve by identity (functions, plain values,
      // anything without `$transform`/`$reference`) still bail out, which
      // covers the common case.
      setValue(() => customizationService.getCustomization(customizationId) as T);
    };

    // Catch registrations that happened between render and effect.
    update();

    // Mode-scope registrations are the ones that race component mounting (they
    // run in mode.onModeEnter), but all three scopes can be written at runtime
    // - global by URL-driven overrides and by any consumer calling
    // setCustomizations with an explicit scope, default by a second init pass.
    // Since getCustomization resolves across all three by priority, a hook that
    // only watched one scope would serve a stale value after a write to either
    // of the others. The bail-out above keeps the extra events cheap.
    const subscriptions = [
      customizationService.EVENTS.MODE_CUSTOMIZATION_MODIFIED,
      customizationService.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED,
      customizationService.EVENTS.DEFAULT_CUSTOMIZATION_MODIFIED,
    ].map(event => customizationService.subscribe(event, update));

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [customizationService, customizationId]);

  return value;
}
