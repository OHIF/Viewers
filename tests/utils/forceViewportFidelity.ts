import type { Page } from '@playwright/test';

export type ForceViewportFidelityOptions = {
  /** When true (default), indicator shows standing/transient lossy UI. */
  lossy?: boolean;
  /** Standing when false (default); transient when true. */
  transient?: boolean;
};

/**
 * Injects a lossy ViewportFidelityState into every Cornerstone viewport that
 * can report fidelity, then fires VIEWPORT_FIDELITY_CHANGED so OHIF's overlay
 * updates. Used by placement e2e so CI does not need a real GPU reduction.
 */
export async function forceViewportFidelity(
  page: Page,
  options: ForceViewportFidelityOptions = {}
): Promise<void> {
  const lossy = options.lossy ?? true;
  const transient = options.transient ?? false;

  await page.waitForFunction(() => {
    const services = (window as any).services;
    const ids: string[] = services?.cornerstoneViewportService?.getViewportIds?.() ?? [];
    return ids.some(id => {
      const vp = services.cornerstoneViewportService.getCornerstoneViewport(id);
      return Boolean(vp?.element && typeof vp.getFidelityState === 'function');
    });
  });

  await page.evaluate(
    ({ lossy: nextLossy, transient: nextTransient }) => {
      const services = (window as any).services;
      const cornerstone = (window as any).cornerstone;
      const eventName = cornerstone.Enums.Events.VIEWPORT_FIDELITY_CHANGED;
      const triggerEvent = cornerstone.utilities.triggerEvent;
      const state = {
        lossy: nextLossy,
        transient: nextTransient,
        shownState: nextLossy ? 'lossy' : 'done',
        cause: 'deviceTextureLimit' as const,
      };

      for (const viewportId of services.cornerstoneViewportService.getViewportIds()) {
        const vp = services.cornerstoneViewportService.getCornerstoneViewport(viewportId);
        if (!vp?.element || typeof vp.getFidelityState !== 'function') {
          continue;
        }

        // Keep readSnapshot() consistent with the injected event.
        vp.getFidelityState = () => state;

        triggerEvent(vp.element, eventName, {
          viewportId,
          renderingEngineId: vp.renderingEngineId,
          state,
        });
      }
    },
    { lossy, transient }
  );
}
